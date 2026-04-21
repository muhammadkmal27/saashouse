#[cfg(test)]
mod tests {
    use axum::Json;
    use axum_extra::extract::cookie::CookieJar;
    use crate::AppState;
    use crate::handlers::auth::registration::register_logic;
    use crate::models::auth::RegisterRequest;
    use crate::utils::error::ApiError;
    use uuid::Uuid;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use crate::utils::realtime::RealtimeHub;

    async fn setup_test_state() -> AppState {
        dotenv::from_filename(".env.test").ok();
        let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL in .env.test");
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&db_url)
            .await
            .expect("Failed to connect to test DB");
        
        AppState {
            pool,
            hub: Arc::new(RealtimeHub::new()),
        }
    }

    #[tokio::test]
    async fn test_registration_success_and_atomic_creation() {
        let state = setup_test_state().await;
        let jar = CookieJar::new();
        let email = format!("test_{}@example.com", Uuid::new_v4());
        
        let payload = RegisterRequest {
            email: email.clone(),
            password: "SecurePassword123!".to_string(),
            full_name: "Test User".to_string(),
        };

        let result = register_logic(state.pool.clone(), jar, payload).await;
        
        assert!(result.is_ok(), "Registration should succeed");
        
        // Verify database records
        let user = sqlx::query!("SELECT id, password_hash FROM users WHERE email = $1", email)
            .fetch_one(&state.pool).await.expect("User record should exist");
        
        let profile = sqlx::query!("SELECT full_name FROM user_profiles WHERE user_id = $1", user.id)
            .fetch_one(&state.pool).await.expect("Profile record should exist");
        
        assert_eq!(profile.full_name, "Test User");
        
        // Verify Hash Integrity (not plain text)
        let hash = user.password_hash.expect("Should have a hash");
        assert_ne!(hash, "SecurePassword123!");
        assert!(hash.starts_with("$argon2id$"), "Should use Argon2 hashing");
    }

    #[tokio::test]
    async fn test_registration_duplicate_email_prevention() {
        let state = setup_test_state().await;
        let jar = CookieJar::new();
        let email = format!("dup_{}@example.com", Uuid::new_v4());
        
        // Insert first user
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", Uuid::new_v4(), email)
            .execute(&state.pool).await.unwrap();

        let payload = RegisterRequest {
            email: email.clone(),
            password: "any_password".to_string(),
            full_name: "Duplicate Tester".to_string(),
        };

        let result = register_logic(state.pool.clone(), jar, payload).await;
        
        assert!(result.is_err(), "Should fail with duplicate email");
        match result.unwrap_err() {
            ApiError::EmailExists => (),
            e => panic!("Expected EmailExists error, got: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_registration_invalid_inputs_safety() {
        let state = setup_test_state().await;
        let jar = CookieJar::new();
        let email = format!("invalid_{}@test.com", Uuid::new_v4());
        
        // Test empty password
        let payload = RegisterRequest {
            email: email.clone(),
            password: "".to_string(),
            full_name: "No Pass".to_string(),
        };

        let result = register_logic(state.pool.clone(), jar, payload).await;
        assert!(result.is_ok());
        
        let user_hash = sqlx::query!("SELECT password_hash FROM users WHERE email = $1", email)
            .fetch_one(&state.pool).await.unwrap();
        assert_ne!(user_hash.password_hash.unwrap(), "");
    }
}
