use axum::Json;
use axum_extra::extract::cookie::{Cookie, CookieJar};
use sqlx::PgPool;
use argon2::{PasswordHash, PasswordVerifier, Argon2};
use crate::models::{auth::{LoginRequest, AuthResponse}, user::{User, UserRole}};
use crate::utils::{error::ApiError, jwt::create_token};

pub async fn login_logic(
    pool: PgPool,
    jar: CookieJar,
    payload: LoginRequest
) -> Result<(CookieJar, Json<AuthResponse>), ApiError> {
    println!("DEBUG: Login attempt for email: {}", payload.email);
    let user: User = sqlx::query_as("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .ok_or(ApiError::InvalidCredentials)?;

    let hash_str = user.password_hash.as_ref().ok_or_else(|| {
        ApiError::BadRequest("Akaun ini didaftarkan melalui Google. Sila log masuk menggunakan butang Google.".to_string())
    })?;

    let parsed_hash = PasswordHash::new(hash_str)
        .map_err(|e| ApiError::Internal(e.to_string()))?;
            
    if Argon2::default().verify_password(payload.password.as_bytes(), &parsed_hash).is_err() {
        return Err(ApiError::InvalidCredentials);
    }

    let role_str = match user.role {
        UserRole::Client => "CLIENT",
        UserRole::Admin => "ADMIN",
    }.to_string();

    // OTP ONLY for Admin
    if user.role == UserRole::Admin {
        let otp_code: String = {
            use rand::RngExt;
            let mut rng = rand::rng();
            (0..6).map(|_| rng.random_range(0..10).to_string()).collect::<String>()
        };
        let expires_at = chrono::Utc::now() + chrono::Duration::try_minutes(5).unwrap();

        sqlx::query!(
            "INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)",
            user.id, otp_code, expires_at
        )
        .execute(&pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

        // Send Email
        let user_email = user.email.clone();
        let otp_clone = otp_code.clone();
        let pool_clone = pool.clone();
        tokio::spawn(async move {
            if let Err(e) = crate::utils::email::send_otp_email(&pool_clone, &user_email, &otp_clone).await {
                eprintln!("Failed to send OTP email: {}", e);
            }
        });

        // Issue a TEMPORARY token that is NOT 2FA verified
        let token = create_token(user.id, role_str.clone(), false)?;
        println!("DEBUG: Issuing 2FA token for user_id: {}", user.id);
        let cookie = Cookie::build(("auth_token", token))
            .path("/")
            .http_only(true)
            .same_site(axum_extra::extract::cookie::SameSite::Lax)
            .secure(false) 
            .build();
        println!("DEBUG: Cookie built: {}", cookie.to_string());

        return Ok((jar.add(cookie), Json(AuthResponse { message: "2FA_REQUIRED".to_owned() })));
    }

    // Direct login for CLIENT
    println!("DEBUG: Issuing direct token for user_id: {}", user.id);
    let token = create_token(user.id, role_str, true)?;
    let cookie = Cookie::build(("auth_token", token))
        .path("/")
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .secure(false) 
        .build();
    println!("DEBUG: Cookie built: {}", cookie.to_string());

    Ok((jar.add(cookie), Json(AuthResponse { message: "Logged in successfully".to_owned() })))
}
