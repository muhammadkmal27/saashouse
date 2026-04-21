use axum::{extract::State, Json, Extension};
use crate::AppState;
use crate::models::{user::{User, UserProfile, UserRole, UserPreferences}, auth::AuthResponse};
use crate::utils::{error::ApiError, jwt::Claims};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UpdatePreferencesRequest {
    pub project_updates: Option<bool>,
    pub billing_alerts: Option<bool>,
    pub security_alerts: Option<bool>,
}
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

#[derive(Deserialize)]
pub struct UpdatePasswordRequest {
    pub current_password: String,
    pub new_password: String,
}
#[derive(Deserialize)]
pub struct UpdateProfileRequest {
    pub full_name: Option<String>,
    pub company_name: Option<String>,
    pub phone_number: Option<String>,
    pub bio: Option<String>,
}

#[derive(serde::Serialize)]
pub struct FullProfile {
    pub user: User,
    pub profile: UserProfile,
}

pub async fn get_my_profile(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<FullProfile>, ApiError> {
    let pool = &state.pool;
    let user = sqlx::query_as!(User, r#"SELECT id, email, password_hash, google_id, role as "role!: UserRole", is_active as "is_active!", created_at, updated_at FROM users WHERE id = $1"#, claims.sub)
        .fetch_one(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let profile = sqlx::query_as!(UserProfile, r#"SELECT user_id, full_name, company_name, phone_number, avatar_url, bio, updated_at FROM user_profiles WHERE user_id = $1"#, claims.sub)
        .fetch_one(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(FullProfile { user, profile }))
}

pub async fn update_my_profile(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdateProfileRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let pool = &state.pool;
    sqlx::query!(
        r#"UPDATE user_profiles SET 
            full_name = COALESCE($1, full_name),
            company_name = COALESCE($2, company_name),
            phone_number = COALESCE($3, phone_number),
            bio = COALESCE($4, bio),
            updated_at = NOW()
        WHERE user_id = $5"#,
        payload.full_name,
        payload.company_name,
        payload.phone_number,
        payload.bio,
        claims.sub
    ).execute(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(AuthResponse { message: "Profile updated successfully".to_owned() }))
}

pub async fn update_password(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdatePasswordRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let pool = &state.pool;

    // Fetch user current password_hash
    let user = sqlx::query!(
        r#"SELECT password_hash FROM users WHERE id = $1"#,
        claims.sub
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::NotFound("User not found".to_owned()))?;

    let hash_str = user.password_hash.ok_or(ApiError::BadRequest("Oauth user cannot set password".to_owned()))?;

    // Verify current password
    let parsed_hash = PasswordHash::new(&hash_str).map_err(|_| ApiError::Internal("Invalid hash format".to_owned()))?;
    if Argon2::default().verify_password(payload.current_password.as_bytes(), &parsed_hash).is_err() {
        return Err(ApiError::Unauthorized);
    }

    // Hash new password
    let salt = SaltString::generate(&mut OsRng);
    let new_hash = Argon2::default()
        .hash_password(payload.new_password.as_bytes(), &salt)
        .map_err(|_| ApiError::Internal("Failed to hash password".to_owned()))?
        .to_string();

    // Update in DB
    sqlx::query!(
        r#"UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2"#,
        new_hash,
        claims.sub
    )
    .execute(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(AuthResponse { message: "Password updated successfully".to_owned() }))
}

pub async fn get_preferences(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<UserPreferences>, ApiError> {
    let pool = &state.pool;
    let prefs = sqlx::query_as!(
        UserPreferences,
        r#"SELECT user_id, project_updates, billing_alerts, security_alerts, updated_at FROM user_preferences WHERE user_id = $1"#,
        claims.sub
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    match prefs {
        Some(p) => Ok(Json(p)),
        None => {
            // Create default preferences if not exists
            let new_prefs = sqlx::query_as!(
                UserPreferences,
                r#"INSERT INTO user_preferences (user_id) VALUES ($1) RETURNING user_id, project_updates, billing_alerts, security_alerts, updated_at"#,
                claims.sub
            )
            .fetch_one(pool)
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?;
            Ok(Json(new_prefs))
        }
    }
}

pub async fn update_preferences(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<UpdatePreferencesRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let pool = &state.pool;
    sqlx::query!(
        r#"UPDATE user_preferences SET 
            project_updates = COALESCE($1, project_updates),
            billing_alerts = COALESCE($2, billing_alerts),
            security_alerts = COALESCE($3, security_alerts),
            updated_at = NOW()
        WHERE user_id = $4"#,
        payload.project_updates,
        payload.billing_alerts,
        payload.security_alerts,
        claims.sub
    )
    .execute(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(AuthResponse { message: "Preferences updated successfully".to_owned() }))
}
