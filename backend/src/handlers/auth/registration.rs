use axum::Json;
use axum_extra::extract::cookie::{Cookie, CookieJar};
use sqlx::PgPool;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, SaltString},
    Argon2
};
use crate::models::{auth::{RegisterRequest, AuthResponse}, user::User};
use crate::utils::{error::ApiError, jwt::create_token};

pub async fn register_logic(
    pool: PgPool,
    jar: CookieJar,
    payload: RegisterRequest
) -> Result<(CookieJar, Json<AuthResponse>), ApiError> {
    // 1. Check if email exists
    let existing: Option<User> = sqlx::query_as("SELECT * FROM users WHERE email = $1")
        .bind(&payload.email)
        .fetch_optional(&pool)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;
        
    if existing.is_some() {
        return Err(ApiError::EmailExists);
    }
    
    // 2. Hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(payload.password.as_bytes(), &salt)
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .to_string();
        
    // 3. Insert user
    let user: User = sqlx::query_as(r#"
        INSERT INTO users (email, password_hash, role) 
        VALUES ($1, $2, 'CLIENT') RETURNING *
    "#).bind(&payload.email).bind(&password_hash)
       .fetch_one(&pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;
       
    // 4. Insert profile
    sqlx::query("INSERT INTO user_profiles (user_id, full_name) VALUES ($1, $2)")
        .bind(&user.id).bind(&payload.full_name)
        .execute(&pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    // 5. Create session cookie
    let token = create_token(user.id, "CLIENT".to_string(), true)?;
    
    let cookie = Cookie::build(("auth_token", token))
        .path("/")
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .build();

    Ok((jar.add(cookie), Json(AuthResponse { message: "Registered and logged in successfully".to_owned() })))
}
