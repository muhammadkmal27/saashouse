#[cfg(test)]
mod tests {
    use sqlx::PgPool;
    use crate::AppState;
    use crate::handlers::auth::password_reset::{forgot_password, reset_password};
    use crate::models::auth::{ForgotPasswordRequest, ResetPasswordRequest};
    use axum::extract::State;
    use axum::Json;
    use uuid::Uuid;
    use chrono::{Utc, Duration};
    use std::sync::Arc;
    use crate::utils::realtime::RealtimeHub;

    async fn setup_test_db() -> PgPool {
        dotenvy::dotenv().ok();
        let database_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        PgPool::connect(&database_url).await.expect("Failed to connect to DB")
    }

    #[tokio::test]
    async fn test_forgot_password_success() {
        let pool = setup_test_db().await;
        let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string());
        let redis_client = redis::Client::open(redis_url).unwrap();
        
        let state = AppState { 
            pool: pool.clone(), 
            redis: redis_client,
            hub: Arc::new(RealtimeHub::new()),
        };

        // Create a test user
        let email = format!("test_forgot_{}@example.com", Uuid::new_v4());
        sqlx::query("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'CLIENT')")
            .bind(&email)
            .bind("hashed_pass")
            .execute(&pool).await.unwrap();

        let payload = ForgotPasswordRequest { email: email.clone() };
        let res = forgot_password(State(state), Json(payload)).await;

        if let Err(e) = &res {
            eprintln!("Forgot password failed: {:?}", e);
        }
        assert!(res.is_ok());
        let body = res.unwrap();
        assert_eq!(body.message, "If an account with that email exists, we have sent a reset link.");

        // Check if token was created
        let reset_exists = sqlx::query("SELECT 1 FROM password_resets WHERE user_id = (SELECT id FROM users WHERE email = $1)")
            .bind(&email)
            .fetch_optional(&pool).await.unwrap();
        assert!(reset_exists.is_some());
    }

    #[tokio::test]
    async fn test_reset_password_success() {
        let pool = setup_test_db().await;
        let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string());
        let redis_client = redis::Client::open(redis_url).unwrap();

        let state = AppState { 
            pool: pool.clone(), 
            redis: redis_client,
            hub: Arc::new(RealtimeHub::new()),
        };

        let email = format!("test_reset_{}@example.com", Uuid::new_v4());
        let user_id: Uuid = sqlx::query_scalar("INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'CLIENT') RETURNING id")
            .bind(&email)
            .bind("old_hash")
            .fetch_one(&pool).await.unwrap();

        let token = Uuid::new_v4().to_string();
        let expires_at = Utc::now() + Duration::try_minutes(30).unwrap();
        sqlx::query("INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind(&token)
            .bind(expires_at)
            .execute(&pool).await.unwrap();

        let payload = ResetPasswordRequest {
            token: token.clone(),
            new_password: "NewPass123!".to_string(),
        };

        let res = reset_password(State(state), Json(payload)).await;

        if let Err(e) = &res {
            eprintln!("Reset password failed: {:?}", e);
        }
        assert!(res.is_ok());
        
        // Verify password updated
        let new_hash: String = sqlx::query_scalar("SELECT password_hash FROM users WHERE id = $1")
            .bind(user_id)
            .fetch_one(&pool).await.unwrap();
        assert!(new_hash != "old_hash");

        // Verify token used
        let is_used: bool = sqlx::query_scalar("SELECT is_used FROM password_resets WHERE token = $1")
            .bind(&token)
            .fetch_one(&pool).await.unwrap();
        assert!(is_used);
    }

    #[tokio::test]
    async fn test_reset_password_expired() {
        let pool = setup_test_db().await;
        let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string());
        let redis_client = redis::Client::open(redis_url).unwrap();

        let state = AppState { 
            pool: pool.clone(), 
            redis: redis_client,
            hub: Arc::new(RealtimeHub::new()),
        };

        let token = format!("expired_{}", Uuid::new_v4());
        let expires_at = Utc::now() - Duration::try_minutes(30).unwrap();
        
        // We need a user for the foreign key
        let user_id: Uuid = sqlx::query_scalar("SELECT id FROM users LIMIT 1").fetch_one(&pool).await.unwrap();

        sqlx::query("INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)")
            .bind(user_id)
            .bind(&token)
            .bind(expires_at)
            .execute(&pool).await.unwrap();

        let payload = ResetPasswordRequest {
            token: token.clone(),
            new_password: "NewPass123!".to_string(),
        };

        let res = reset_password(State(state), Json(payload)).await;
        if let Ok(r) = &res {
            eprintln!("Reset password should have failed but succeeded: {:?}", r);
        }
        assert!(res.is_err());
    }
}
