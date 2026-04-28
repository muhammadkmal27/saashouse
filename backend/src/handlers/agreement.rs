use axum::{extract::{State, Path}, Json, Extension};
use sqlx::Row;
use crate::AppState;
use crate::models::agreement::{ServiceAgreement, SignAgreementRequest};
use crate::utils::{error::ApiError, jwt::Claims};
use crate::handlers::settings::get_setting_value;

/// POST /api/projects/:id/agreement — Sign a service agreement
#[utoipa::path(
    post,
    path = "/api/projects/{id}/agreement",
    responses(
        (status = 200, description = "Agreement signed successfully", body = ServiceAgreement),
        (status = 404, description = "Project not found"),
        (status = 500, description = "Internal server error")
    ),
    params(
        ("id" = Uuid, Path, description = "Project ID")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn sign_agreement(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<uuid::Uuid>,
    Json(payload): Json<SignAgreementRequest>,
) -> Result<Json<ServiceAgreement>, ApiError> {
    // 1. Fetch project to verify ownership and get details
    let project = sqlx::query("SELECT id, title, client_id, selected_plan, requirements FROM projects WHERE id = $1 AND client_id = $2")
        .bind(project_id)
        .bind(claims.sub)
        .fetch_one(&state.pool)
        .await
        .map_err(|_| ApiError::NotFound("Project not found".into()))?;

    let project_title: String = project.get("title");
    let selected_plan: Option<String> = project.get("selected_plan");
    let requirements: Option<serde_json::Value> = project.get("requirements");

    // Determine actual plan name - Priority: Payload > DB selected_plan > DB requirements
    let plan_name = payload.plan_name.clone()
        .filter(|s| !s.is_empty())
        .or_else(|| selected_plan.filter(|s| !s.is_empty()))
        .or_else(|| {
            requirements.as_ref()
                .and_then(|r| r.get("selected_plan"))
                .and_then(|p| p.as_str())
                .map(|s| s.to_string())
        })
        .unwrap_or_else(|| "Standard".to_string());

    let is_otp = plan_name.to_lowercase().contains("one-time");

    // 2. Fetch prices/settings
    let provider_name = get_setting_value(&state.pool, "service_provider_name")
        .await
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "SaaS House Development".to_string());

    let provider_signature = get_setting_value(&state.pool, "service_provider_signature")
        .await
        .and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "".to_string());

    let (deposit, balance, total) = if is_otp {
        let otp_deposit = get_setting_value(&state.pool, "otp_deposit_price")
            .await
            .and_then(|v| {
                v.as_f64()
                 .or_else(|| v.as_str().and_then(|s| s.parse().ok()))
                 .or_else(|| v.as_u64().map(|u| u as f64))
            })
            .unwrap_or(200.0);

        let otp_final = get_setting_value(&state.pool, "otp_final_price")
            .await
            .and_then(|v| {
                v.as_f64()
                 .or_else(|| v.as_str().and_then(|s| s.parse().ok()))
                 .or_else(|| v.as_u64().map(|u| u as f64))
            })
            .unwrap_or(500.0);

        (otp_deposit, otp_final, otp_deposit + otp_final)
    } else {
        // Fetch plan prices
        let prices = crate::handlers::settings::get_setting_value(&state.pool, "package_prices").await;
        let default_prices = serde_json::json!({
            "Standard": "165",
            "Growth": "240",
            "Enterprise": "410",
            "Platinum": "750"
        });
        let prices = prices.unwrap_or(default_prices);

        let price_val = match plan_name.to_uppercase().as_str() {
            "GROWTH" => prices.get("Growth"),
            "ENTERPRISE" => prices.get("Enterprise"),
            "PLATINUM" => prices.get("Platinum"),
            _ => prices.get("Standard"),
        };

        let price_f64 = price_val
            .and_then(|v| {
                if v.is_string() {
                    v.as_str().and_then(|s| s.parse::<f64>().ok())
                } else {
                    v.as_f64()
                }
            })
            .unwrap_or(165.0);

        // For SaaS: Deposit = Monthly Fee, Balance = 0, Total = Monthly Fee
        (price_f64, 0.0, price_f64)
    };

    // 3. Save agreement
    let row = sqlx::query(
        r#"
        INSERT INTO service_agreements (
            project_id, user_id, client_name, provider_name, project_name, 
            total_cost, deposit_amount, balance_amount, signature_data, provider_signature
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (project_id) DO UPDATE SET
            client_name = EXCLUDED.client_name,
            total_cost = EXCLUDED.total_cost,
            deposit_amount = EXCLUDED.deposit_amount,
            balance_amount = EXCLUDED.balance_amount,
            signature_data = EXCLUDED.signature_data,
            provider_signature = EXCLUDED.provider_signature,
            signed_at = NOW()
        RETURNING id, project_id, user_id, client_name, provider_name, project_name,
                  total_cost::FLOAT8, deposit_amount::FLOAT8, balance_amount::FLOAT8,
                  signed_at, signature_data, provider_signature
        "#
    )
    .bind(project_id)
    .bind(claims.sub)
    .bind(payload.client_name)
    .bind(provider_name)
    .bind(project_title)
    .bind(total as f64)
    .bind(deposit as f64)
    .bind(balance as f64)
    .bind(Some(payload.signature_data))
    .bind(Some(provider_signature))
    .fetch_one(&state.pool)
    .await
    .map_err(|e| {
        eprintln!("SIGN_AGREEMENT_ERROR: {:?}", e);
        ApiError::Internal(e.to_string())
    })?;

    let agreement = ServiceAgreement {
        id: row.get("id"),
        project_id: row.get("project_id"),
        user_id: row.get("user_id"),
        client_name: row.get("client_name"),
        provider_name: row.get("provider_name"),
        project_name: row.get("project_name"),
        total_cost: row.get::<f64, _>(6), // total_cost::FLOAT8
        deposit_amount: row.get::<f64, _>(7), // deposit_amount::FLOAT8
        balance_amount: row.get::<f64, _>(8), // balance_amount::FLOAT8
        signed_at: row.get("signed_at"),
        signature_data: row.get("signature_data"),
        provider_signature: row.get("provider_signature"),
        plan_name: Some(plan_name),
    };

    Ok(Json(agreement))
}

/// GET /api/projects/:id/agreement — Fetch project's agreement
#[utoipa::path(
    get,
    path = "/api/projects/{id}/agreement",
    responses(
        (status = 200, description = "Agreement found", body = ServiceAgreement),
        (status = 404, description = "Agreement not found")
    ),
    params(
        ("id" = Uuid, Path, description = "Project ID")
    ),
    security(
        ("jwt" = [])
    )
)]
pub async fn get_agreement(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(project_id): Path<uuid::Uuid>,
) -> Result<Json<ServiceAgreement>, ApiError> {
    let sql = r#"
        SELECT a.id, a.project_id, a.user_id, a.client_name, a.provider_name, a.project_name,
               a.total_cost::FLOAT8 as total_cost, 
               a.deposit_amount::FLOAT8 as deposit_amount, 
               a.balance_amount::FLOAT8 as balance_amount,
               a.signed_at, a.signature_data, a.provider_signature,
               COALESCE(NULLIF(p.selected_plan, ''), s.plan_name, p.requirements->>'selected_plan') as plan_name
        FROM service_agreements a
        LEFT JOIN projects p ON a.project_id = p.id
        LEFT JOIN subscriptions s ON p.id = s.project_id
        WHERE a.project_id = $1
    "#;

    let row = if claims.role == "ADMIN" {
        sqlx::query(sql)
            .bind(project_id)
            .fetch_one(&state.pool)
            .await
    } else {
        sqlx::query(&(sql.to_string() + " AND a.user_id = $2"))
            .bind(project_id)
            .bind(claims.sub)
            .fetch_one(&state.pool)
            .await
    }
    .map_err(|_| ApiError::NotFound("Agreement not found".into()))?;

    let agreement = ServiceAgreement {
        id: row.get("id"),
        project_id: row.get("project_id"),
        user_id: row.get("user_id"),
        client_name: row.get("client_name"),
        provider_name: row.get("provider_name"),
        project_name: row.get("project_name"),
        total_cost: row.get::<f64, _>("total_cost"),
        deposit_amount: row.get::<f64, _>("deposit_amount"),
        balance_amount: row.get::<f64, _>("balance_amount"),
        signed_at: row.get("signed_at"),
        signature_data: row.get("signature_data"),
        provider_signature: row.get("provider_signature"),
        plan_name: row.get("plan_name"),
    };

    Ok(Json(agreement))
}
