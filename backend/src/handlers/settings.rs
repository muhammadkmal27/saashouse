use axum::{extract::State, Json, Extension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use crate::AppState;
use crate::utils::{error::ApiError, jwt::Claims};

#[derive(Debug, Serialize, Deserialize)]
pub struct SettingItem {
    pub key: String,
    pub value: Value,
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingRequest {
    pub value: Value,
}

/// GET /api/admin/settings — Fetch all system settings
pub async fn get_all_settings(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<SettingItem>>, ApiError> {
    if claims.role != "ADMIN" {
        return Err(ApiError::Unauthorized);
    }

    let rows = sqlx::query!(
        r#"SELECT key, value FROM system_settings ORDER BY key ASC"#
    )
    .fetch_all(&state.pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    let items: Vec<SettingItem> = rows
        .into_iter()
        .map(|r| SettingItem { key: r.key, value: r.value })
        .collect();

    Ok(Json(items))
}

/// PATCH /api/admin/settings/:key — Update a specific setting
pub async fn update_setting(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    axum::extract::Path(key): axum::extract::Path<String>,
    Json(payload): Json<UpdateSettingRequest>,
) -> Result<Json<Value>, ApiError> {
    if claims.role != "ADMIN" {
        return Err(ApiError::Unauthorized);
    }

    // Validate key is one of the allowed settings
    let allowed_keys = ["admin_email", "maintenance_mode", "smtp_config"];
    if !allowed_keys.contains(&key.as_str()) {
        return Err(ApiError::BadRequest(format!("Unknown setting key: {}", key)));
    }

    sqlx::query!(
        r#"
        INSERT INTO system_settings (key, value, updated_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (key) DO UPDATE
            SET value = EXCLUDED.value,
                updated_at = NOW()
        "#,
        key,
        payload.value
    )
    .execute(&state.pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({ "success": true, "key": key })))
}

/// Helper: Read a specific setting value from DB (used internally in other handlers)
pub async fn get_setting_value(pool: &sqlx::PgPool, key: &str) -> Option<Value> {
    sqlx::query!(
        "SELECT value FROM system_settings WHERE key = $1",
        key
    )
    .fetch_optional(pool)
    .await
    .ok()
    .flatten()
    .map(|r| r.value)
}

/// GET /api/status — Public endpoint, no auth required.
/// Returns maintenance_mode flag so Next.js middleware can intercept public routes.
pub async fn get_public_status(
    State(state): State<AppState>,
) -> Json<Value> {
    let maintenance = get_setting_value(&state.pool, "maintenance_mode")
        .await
        .and_then(|v| v.as_bool())
        .unwrap_or(false);

    Json(serde_json::json!({
        "maintenance_mode": maintenance,
        "status": if maintenance { "maintenance" } else { "ok" }
    }))
}
