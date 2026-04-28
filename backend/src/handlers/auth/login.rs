use axum::Json;
use axum_extra::extract::cookie::{Cookie, CookieJar};
use sqlx::PgPool;
use argon2::{PasswordHash, PasswordVerifier, Argon2};
use crate::models::{auth::{LoginRequest, AuthResponse}, user::{User, UserRole}};
use validator::Validate;
use crate::utils::{error::ApiError, jwt::create_token, security_logger::{log_security_event, SecurityEvent}};

pub async fn login_logic(
    pool: PgPool,
    jar: CookieJar,
    payload: LoginRequest,
    ip: Option<String>,
    ua: Option<String>,
) -> Result<(CookieJar, Json<AuthResponse>), ApiError> {
    // 0. Strict Input Validation (Rule 1)
    payload.validate().map_err(ApiError::Validation)?;

    let user_opt: Option<User> = sqlx::query_as("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let user = if let Some(u) = user_opt {
        u
    } else {
        log_security_event(&pool, SecurityEvent::LoginFailed { email: payload.email.clone(), reason: "User not found".into() }, ip, ua).await;
        return Err(ApiError::InvalidCredentials);
    };

    let hash_str = user.password_hash.as_ref().ok_or_else(|| {
        ApiError::BadRequest("Akaun ini didaftarkan melalui Google. Sila log masuk menggunakan butang Google.".to_string())
    })?;

    let parsed_hash = PasswordHash::new(hash_str)
        .map_err(|e| ApiError::Internal(e.to_string()))?;
            
    if Argon2::default().verify_password(payload.password.as_bytes(), &parsed_hash).is_err() {
        log_security_event(&pool, SecurityEvent::LoginFailed { email: payload.email.clone(), reason: "Invalid password".into() }, ip, ua).await;
        return Err(ApiError::InvalidCredentials);
    }

    log_security_event(&pool, SecurityEvent::LoginSuccess { user_id: user.id }, ip, ua).await;

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
        let cookie = crate::utils::cookie::build_auth_cookie(token);
        println!("DEBUG: Cookie built: {}", cookie.to_string());

        return Ok((jar.add(cookie), Json(AuthResponse { 
            message: "2FA_REQUIRED".to_owned(),
            csrf_token: None 
        })));
    }

    // Direct login for CLIENT
    println!("DEBUG: Issuing direct token for user_id: {}", user.id);
    // 5. Create session cookie (Rule 20)
    let token = create_token(user.id, role_str, true)?;
    let cookie = crate::utils::cookie::build_auth_cookie(token);
    
    // 6. CSRF Protection (Rule 19)
    let csrf_token = uuid::Uuid::new_v4().to_string();
    let csrf_cookie = crate::utils::cookie::build_csrf_cookie(csrf_token.clone());

    Ok((
        jar.add(cookie).add(csrf_cookie), 
        Json(AuthResponse { 
            message: "Logged in successfully".to_owned(),
            csrf_token: Some(csrf_token),
        })
    ))
}
