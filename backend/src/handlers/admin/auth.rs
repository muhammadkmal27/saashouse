use axum::{extract::State, Json};
use sqlx::PgPool;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
    Argon2
};
use crate::models::admin::CreateAdminRequest;
use crate::models::auth::AuthResponse;
use crate::utils::error::ApiError;
use crate::AppState;

pub async fn create_admin_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateAdminRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    use validator::Validate;
    payload.validate().map_err(ApiError::Validation)?;
    let pool = &state.pool;
    // 1. Check if email exists
    let existing = sqlx::query!("SELECT id FROM users WHERE email = $1", payload.email)
        .fetch_optional(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    if existing.is_some() {
        return Err(ApiError::EmailExists);
    }

    // 2. Hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(payload.password.as_bytes(), &salt)
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .to_string();

    // 3. Insert user & profile in a transaction
    let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let user_id = sqlx::query!(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'ADMIN') RETURNING id",
        payload.email,
        password_hash
    ).fetch_one(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?.id;

    sqlx::query!(
        "INSERT INTO user_profiles (user_id, full_name) VALUES ($1, $2)",
        user_id,
        payload.full_name
    ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(AuthResponse { 
        message: "Admin user created successfully".to_owned(),
        csrf_token: None 
    }))
}
