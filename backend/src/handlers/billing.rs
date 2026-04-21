use axum::{
    extract::{State, Path, Query},
    response::{IntoResponse, Redirect, Response},
    Json,
    Extension,
};
use sqlx::PgPool;
use uuid::Uuid;
use serde::{Deserialize, Serialize};
use std::env;
use utoipa::ToSchema;
use crate::AppState;
use crate::models::{billing::{Subscription, AutoRenewRequest}, auth::AuthResponse, user::UserRole};
use crate::utils::{error::ApiError, jwt::Claims};
use reqwest::header::{AUTHORIZATION, HeaderMap};
use axum_extra::extract::cookie::{Cookie, CookieJar};

#[derive(Deserialize, ToSchema)]
pub struct CreateSessionRequest {
    pub project_id: Uuid,
}

#[derive(Serialize, ToSchema)]
pub struct SessionResponse {
    pub url: String,
}

#[derive(Deserialize, utoipa::IntoParams)]
pub struct SubscriptionQuery {
    pub project_id: Option<uuid::Uuid>,
}

#[utoipa::path(
    post,
    path = "/api/billing/checkout",
    request_body = CreateSessionRequest,
    responses(
        (status = 200, description = "Stripe checkout session created", body = SessionResponse)
    ),
    security(("cookieAuth" = []))
)]
pub async fn create_subscription_session(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateSessionRequest>,
) -> Result<Json<SessionResponse>, ApiError> {
    let pool = &state.pool;
    let stripe_secret = env::var("STRIPE_SECRET_KEY").map_err(|_| ApiError::Internal("STRIPE_SECRET_KEY not set".into()))?;
    let frontend_url = env::var("FRONTEND_URL").unwrap_or("http://localhost:3000".to_string());
    // 1. Get User Stripe Customer ID & Project Details (to find selected_plan)
    let user = sqlx::query!("SELECT stripe_customer_id, email FROM users WHERE id = $1", claims.sub)
        .fetch_one(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let project = sqlx::query!("SELECT selected_plan FROM projects WHERE id = $1 AND client_id = $2", payload.project_id, claims.sub)
        .fetch_one(pool).await.map_err(|e| ApiError::NotFound("Project not found".into()))?;

    let selected_plan = project.selected_plan.as_deref().unwrap_or("Standard");

    let price_id_key = match selected_plan.to_uppercase().as_str() {
        "GROWTH" => "STRIPE_PRICE_GROWTH",
        "ENTERPRISE" => "STRIPE_PRICE_ENTERPRISE",
        "PLATINUM" => "STRIPE_PRICE_PLATINUM",
        _ => "STRIPE_PRICE_STANDARD",
    };

    let price_id = env::var(price_id_key).map_err(|_| ApiError::Internal(format!("{} not set", price_id_key)))?;

    let customer_id = if let Some(cid) = user.stripe_customer_id {
        cid
    } else {
        let client = reqwest::Client::new();
        let res = client.post("https://api.stripe.com/v1/customers")
            .header(AUTHORIZATION, format!("Bearer {}", stripe_secret))
            .form(&[("email", user.email.as_str())])
            .send().await.map_err(|e| ApiError::Internal(e.to_string()))?;
        
        let data: serde_json::Value = res.json().await.map_err(|e| ApiError::Internal(e.to_string()))?;
        let nid = data["id"].as_str().ok_or(ApiError::Internal("Failed to create Stripe customer".into()))?.to_string();
        
        sqlx::query!("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", nid, claims.sub)
            .execute(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        nid
    };

    // 2. Create Checkout Session
    let client = reqwest::Client::new();
    let res = client.post("https://api.stripe.com/v1/checkout/sessions")
        .header(AUTHORIZATION, format!("Bearer {}", stripe_secret))
        .form(&[
            ("customer", customer_id.as_str()),
            ("mode", "subscription"),
            ("success_url", format!("{}/app/payment/success?session_id={{CHECKOUT_SESSION_ID}}", frontend_url).as_str()),
            ("cancel_url", format!("{}/app/payment/cancel", frontend_url).as_str()),
            ("line_items[0][price]", price_id.as_str()),
            ("line_items[0][quantity]", "1"),
            ("metadata[project_id]", payload.project_id.to_string().as_str()),
            ("metadata[user_id]", claims.sub.to_string().as_str()),
            ("metadata[plan_name]", selected_plan),
        ])
        .send().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let data: serde_json::Value = res.json().await.map_err(|e| ApiError::Internal(e.to_string()))?;
    let url = data["url"].as_str().ok_or(ApiError::Internal("Failed to create Stripe session".into()))?.to_string();

    Ok(Json(SessionResponse { url }))
}

#[utoipa::path(
    get,
    path = "/api/billing/subscription",
    params(
        SubscriptionQuery
    ),
    responses(
        (status = 200, description = "Current subscription info", body = Subscription)
    ),
    security(("cookieAuth" = []))
)]
pub async fn get_subscription(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<SubscriptionQuery>,
) -> Result<Json<Subscription>, ApiError> {
    let pool = &state.pool;
    let sub = if let Some(pid) = query.project_id {
        // IDOR Protection: Ensure project belongs to current user
        sqlx::query_as!(Subscription, r#"SELECT id, client_id as "client_id!", project_id, stripe_sub_id, plan_name, status, current_period_end, cancel_at_period_end, created_at, updated_at FROM subscriptions WHERE client_id = $1 AND project_id = $2 ORDER BY created_at DESC LIMIT 1"#, claims.sub, pid)
            .fetch_optional(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?
    } else {
        sqlx::query_as!(Subscription, r#"SELECT id, client_id as "client_id!", project_id, stripe_sub_id, plan_name, status, current_period_end, cancel_at_period_end, created_at, updated_at FROM subscriptions WHERE client_id = $1 ORDER BY created_at DESC LIMIT 1"#, claims.sub)
            .fetch_optional(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?
    };

    let sub = sub.ok_or(ApiError::NotFound("No valid subscription found for this project".into()))?;
    Ok(Json(sub))
}

#[utoipa::path(
    post,
    path = "/api/billing/projects/{id}/auto-renew",
    params(
        ("id" = Uuid, Path, description = "Project ID")
    ),
    request_body = AutoRenewRequest,
    responses(
        (status = 200, description = "Auto-renewal status updated", body = AuthResponse)
    ),
    security(("cookieAuth" = []))
)]
pub async fn toggle_auto_renew(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<uuid::Uuid>,
    Json(payload): Json<AutoRenewRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let pool = &state.pool;
    let stripe_secret = env::var("STRIPE_SECRET_KEY").map_err(|_| ApiError::Internal("STRIPE_SECRET_KEY not set".into()))?;

    let sub = sqlx::query_as!(Subscription, r#"SELECT id, client_id as "client_id!", project_id, stripe_sub_id, plan_name, status, current_period_end, cancel_at_period_end, created_at, updated_at FROM subscriptions WHERE project_id = $1 AND client_id = $2"#, project_id, claims.sub)
        .fetch_optional(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?
        .ok_or(ApiError::NotFound("Subscription not found".into()))?;

    let stripe_sub_id = sub.stripe_sub_id.ok_or(ApiError::BadRequest("No active stripe subscription".into()))?;

    let client = reqwest::Client::new();
    let res = client.post(format!("https://api.stripe.com/v1/subscriptions/{}", stripe_sub_id))
        .header(AUTHORIZATION, format!("Bearer {}", stripe_secret))
        .form(&[("cancel_at_period_end", if payload.cancel_at_period_end { "true" } else { "false" })])
        .send().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    if !res.status().is_success() {
        return Err(ApiError::Internal("Failed to update Stripe subscription".into()));
    }

    sqlx::query!("UPDATE subscriptions SET cancel_at_period_end = $1 WHERE id = $2", payload.cancel_at_period_end, sub.id)
        .execute(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(AuthResponse { message: format!("Auto-renewal updated successfully") }))
}

pub async fn handle_stripe_webhook(
    State(state): State<AppState>,
    _headers: HeaderMap,
    body: String,
) -> Result<impl IntoResponse, ApiError> {
    let pool = &state.pool;
    let event: serde_json::Value = serde_json::from_str(&body).map_err(|_| ApiError::BadRequest("Invalid JSON".into()))?;
    let event_type = event["type"].as_str().unwrap_or_default();

    match event_type {
        "checkout.session.completed" => {
            let session = &event["data"]["object"];
            let project_id_str = session["metadata"]["project_id"].as_str().unwrap_or_default();
            let user_id_str = session["metadata"]["user_id"].as_str().unwrap_or_default();
            let sub_id = session["subscription"].as_str().unwrap_or_default();
            
            if let (Ok(pid), Ok(uid)) = (uuid::Uuid::parse_str(project_id_str), uuid::Uuid::parse_str(user_id_str)) {
                let plan_name = session["metadata"]["plan_name"].as_str().unwrap_or("Standard");
                let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;
                
                sqlx::query!("UPDATE projects SET status = 'LIVE', selected_plan = $1 WHERE id = $2", plan_name, pid)
                    .execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

                sqlx::query!(
                    "INSERT INTO subscriptions (client_id, project_id, stripe_sub_id, plan_name, status, current_period_end) 
                     VALUES ($1, $2, $3, $4, 'active', NOW() + INTERVAL '1 month')
                     ON CONFLICT (stripe_sub_id) DO UPDATE SET status = 'active', current_period_end = EXCLUDED.current_period_end, plan_name = EXCLUDED.plan_name",
                    uid, pid, sub_id, plan_name
                ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

                tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;
            }
        },
        _ => {}
    }

    Ok(axum::http::StatusCode::OK)
}

