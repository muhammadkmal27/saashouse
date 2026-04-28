use axum::Json;
use axum_extra::extract::cookie::{Cookie, CookieJar};
use sqlx::PgPool;
use crate::models::{auth::{AuthResponse, Verify2FARequest}, user::User};
use crate::utils::{error::ApiError, jwt::create_token};
use validator::Validate;

pub async fn verify_2fa_logic(
    pool: PgPool,
    jar: CookieJar,
    payload: Verify2FARequest
) -> Result<(CookieJar, Json<AuthResponse>), ApiError> {
    // 0. Strict Input Validation (Rule 1)
    payload.validate().map_err(ApiError::Validation)?;

    let token = jar.get("auth_token").map(|c| c.value().to_string()).ok_or(ApiError::Unauthorized)?;
    let claims = crate::utils::jwt::verify_token(&token)?;

    // RULE: OTP ONLY for ADMIN
    if claims.role != "ADMIN" {
        return Err(ApiError::Forbidden("Only admins require 2FA verification".to_string()));
    }

    let code = payload.code.clone();

    let otp = sqlx::query!(
        "SELECT * FROM otps WHERE user_id = $1 AND code = $2 AND is_used = false AND expires_at > NOW()",
        claims.sub, code
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::BadRequest("Invalid or expired OTP code".to_string()))?;

    // Mark as used
    sqlx::query!("UPDATE otps SET is_used = true WHERE id = $1", otp.id)
        .execute(&pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    // Issue FINAL token with 2FA verified
    let token = create_token(claims.sub, claims.role, true)?;
    let cookie = crate::utils::cookie::build_auth_cookie(token);

    // 6. CSRF Protection (Rule 19)
    let csrf_token = uuid::Uuid::new_v4().to_string();
    let csrf_cookie = crate::utils::cookie::build_csrf_cookie(csrf_token.clone());

    Ok((
        jar.add(cookie).add(csrf_cookie), 
        Json(AuthResponse { 
            message: "2FA verified successfully".to_owned(),
            csrf_token: Some(csrf_token),
        })
    ))
}

pub async fn resend_otp_logic(
    pool: PgPool,
    jar: CookieJar,
) -> Result<(CookieJar, Json<AuthResponse>), ApiError> {
    let token = jar.get("auth_token").map(|c| c.value().to_string()).ok_or(ApiError::Unauthorized)?;
    let claims = crate::utils::jwt::verify_token(&token)?;

    // RULE: OTP ONLY for ADMIN
    if claims.role != "ADMIN" {
        return Err(ApiError::Forbidden("Only admins can request 2FA codes".to_string()));
    }

    // Only allow if not yet 2FA verified
    if claims.is_2fa_verified {
        return Err(ApiError::BadRequest("Already verified".to_string()));
    }

    // Generate new OTP
    let otp_code: String = {
        use rand::RngExt;
        let mut rng = rand::rng();
        (0..6).map(|_| rng.random_range(0..10).to_string()).collect::<String>()
    };
    let expires_at = chrono::Utc::now() + chrono::Duration::try_minutes(5).unwrap();

    // Invalidate old OTPs
    sqlx::query!("UPDATE otps SET is_used = true WHERE user_id = $1 AND is_used = false", claims.sub)
        .execute(&pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    // Insert new OTP
    sqlx::query!(
        "INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)",
        claims.sub, otp_code, expires_at
    )
    .execute(&pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    // Get user email
    let user: User = sqlx::query_as("SELECT * FROM users WHERE id = $1")
        .bind(&claims.sub)
        .fetch_one(&pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let user_email = user.email.clone();
    let otp_clone = otp_code.clone();
    let pool_clone = pool.clone();
    tokio::spawn(async move {
        if let Err(e) = crate::utils::email::send_otp_email(&pool_clone, &user_email, &otp_clone).await {
            eprintln!("Failed to send OTP email: {}", e);
        }
    });

    Ok((jar, Json(AuthResponse { 
        message: "OTP resent successfully".to_owned(),
        csrf_token: None 
    })))
}
