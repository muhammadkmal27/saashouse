use axum::{extract::{State, Path}, Json};
use crate::AppState;
use crate::utils::error::ApiError;

#[utoipa::path(
    post,
    path = "/api/admin/subscriptions/{id}/cancel",
    responses(
        (status = 200, description = "Admin manual override cancelation success")
    ),
    security(("cookieAuth" = []))
)]
pub async fn admin_cancel_subscription(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let pool = &state.pool;
    let stripe_secret = std::env::var("STRIPE_SECRET_KEY").map_err(|_| ApiError::Internal("STRIPE_SECRET_KEY not set".into()))?;

    // 1. Fetch Subscription and Project Details
    let sub = sqlx::query!(
        "SELECT stripe_sub_id, project_id FROM subscriptions WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::NotFound("Subscription not found".into()))?;

    // 2. Call Stripe if ID exists
    if let Some(stripe_id) = sub.stripe_sub_id {
        let client = reqwest::Client::new();
        let res = client.delete(format!("https://api.stripe.com/v1/subscriptions/{}", stripe_id))
            .header(reqwest::header::AUTHORIZATION, format!("Bearer {}", stripe_secret))
            .send().await.map_err(|e| ApiError::Internal(format!("Stripe Communication Error: {}", e)))?;

        // Even if Stripe returns 404 (already canceled), we proceed to sync local DB
        if !res.status().is_success() && res.status() != reqwest::StatusCode::NOT_FOUND {
            let error_body = res.text().await.unwrap_or_default();
            return Err(ApiError::Internal(format!("Stripe API Error: {}", error_body)));
        }
    }

    let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    // 3. Update subscription status
    sqlx::query!(
        "UPDATE subscriptions SET status = 'CANCELED_BY_ADMIN', updated_at = NOW() WHERE id = $1",
        id
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    // 4. Update project status to allow re-activation
    if let Some(pid) = sub.project_id {
        sqlx::query!(
            "UPDATE projects SET status = 'PAYMENT_PENDING', updated_at = NOW() WHERE id = $1",
            pid
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;
    }

    tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({"success": true, "message": "Subscription canceled and project status reset to Payment Pending."})))
}
