use sqlx::PgPool;
use uuid::Uuid;
use serde_json::Value;

pub enum SecurityEvent {
    LoginFailed { email: String, reason: String },
    LoginSuccess { user_id: Uuid },
    PasswordChange { user_id: Uuid },
    UnauthorizedAccess { path: String, user_id: Option<Uuid> },
    CsrfFailure { path: String, ip: String },
    RateLimitExceeded { ip: String, path: String },
}

pub async fn log_security_event(
    pool: &PgPool,
    event: SecurityEvent,
    ip: Option<String>,
    user_agent: Option<String>,
) {
    let (event_type, user_id, email, details) = match event {
        SecurityEvent::LoginFailed { email, reason } => (
            "LOGIN_FAILED",
            None,
            Some(email),
            serde_json::json!({ "reason": reason }),
        ),
        SecurityEvent::LoginSuccess { user_id } => (
            "LOGIN_SUCCESS",
            Some(user_id),
            None,
            serde_json::json!({}),
        ),
        SecurityEvent::PasswordChange { user_id } => (
            "PASSWORD_CHANGE",
            Some(user_id),
            None,
            serde_json::json!({}),
        ),
        SecurityEvent::UnauthorizedAccess { path, user_id } => (
            "UNAUTHORIZED_ACCESS",
            user_id,
            None,
            serde_json::json!({ "path": path }),
        ),
        SecurityEvent::CsrfFailure { path, ip: _ } => (
            "CSRF_FAILURE",
            None,
            None,
            serde_json::json!({ "path": path }),
        ),
        SecurityEvent::RateLimitExceeded { ip: _, path } => (
            "RATE_LIMIT_EXCEEDED",
            None,
            None,
            serde_json::json!({ "path": path }),
        ),
    };

    let _ = sqlx::query!(
        "INSERT INTO security_events (event_type, user_id, email, ip_address, user_agent, details) 
         VALUES ($1, $2, $3, $4, $5, $6)",
        event_type,
        user_id,
        email,
        ip,
        user_agent,
        details
    )
    .execute(pool)
    .await;
}
