use axum_extra::extract::cookie::CookieJar;
use axum::{extract::State, Json, response::{IntoResponse, Response}};
use sqlx::{PgPool, Postgres};
use crate::AppState;
use crate::models::{auth::{ForgotPasswordRequest, ResetPasswordRequest, AuthResponse}, user::{User, UserRole}};
use crate::utils::error::ApiError;
use validator::Validate;
use uuid::Uuid;
use chrono::{Utc, Duration, DateTime};
use rand::Rng;
use rand::distr::{Alphanumeric, SampleString};

#[derive(sqlx::FromRow)]
struct PasswordReset {
    id: Uuid,
    user_id: Uuid,
    token: String,
    expires_at: DateTime<Utc>,
    is_used: bool,
    created_at: DateTime<Utc>,
}

#[utoipa::path(
    post,
    path = "/api/auth/forgot-password",
    request_body = ForgotPasswordRequest,
    responses(
        (status = 200, description = "If account exists, email sent", body = AuthResponse)
    )
)]
pub async fn forgot_password(
    State(state): State<AppState>,
    Json(payload): Json<ForgotPasswordRequest>
) -> Result<Json<AuthResponse>, ApiError> {
    payload.validate().map_err(ApiError::Validation)?;
    let pool = &state.pool;

    // Use non-macro query to avoid compile-time DB checks issues
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    if let Some(user) = user {
        let token = Alphanumeric.sample_string(&mut rand::rng(), 64);
        let expires_at = Utc::now() + Duration::try_minutes(30).unwrap();

        sqlx::query("INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)")
            .bind(user.id)
            .bind(&token)
            .bind(expires_at)
            .execute(pool)
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        let user_email = user.email.clone();
        let pool_clone = pool.clone();
        tokio::spawn(async move {
            if let Err(e) = crate::utils::email::send_password_reset_email(&pool_clone, &user_email, &token).await {
                eprintln!("Failed to send password reset email to {}: {}", user_email, e);
            }
        });
    }

    Ok(Json(AuthResponse {
        message: "If an account with that email exists, we have sent a reset link.".to_string(),
        csrf_token: None,
    }))
}

#[utoipa::path(
    post,
    path = "/api/auth/reset-password",
    request_body = ResetPasswordRequest,
    responses(
        (status = 200, description = "Password reset successfully", body = AuthResponse)
    )
)]
pub async fn reset_password(
    State(state): State<AppState>,
    Json(payload): Json<ResetPasswordRequest>
) -> Result<Json<AuthResponse>, ApiError> {
    payload.validate().map_err(ApiError::Validation)?;
    let pool = &state.pool;

    let reset = sqlx::query_as::<_, PasswordReset>("SELECT * FROM password_resets WHERE token = $1 AND is_used = false AND expires_at > NOW()")
        .bind(&payload.token)
        .fetch_optional(pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .ok_or(ApiError::BadRequest("Invalid or expired reset token".to_string()))?;

    let hashed_password = crate::utils::hash::hash_password(&payload.new_password)?;

    let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    sqlx::query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2")
        .bind(hashed_password)
        .bind(reset.user_id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    sqlx::query("UPDATE password_resets SET is_used = true WHERE id = $1")
        .bind(reset.id)
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(AuthResponse {
        message: "Password has been reset successfully. You can now log in.".to_string(),
        csrf_token: None,
    }))
}

