#[cfg(test)]
mod tests {
    use axum::Json;
    use crate::handlers::admin::auth::create_admin_user;
    use crate::models::admin::CreateAdminRequest;
    use crate::utils::error::ApiError;
    use crate::AppState;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use crate::utils::realtime::RealtimeHub;
    use uuid::Uuid;
    use axum::extract::State;

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
            redis: redis::Client::open("redis://127.0.0.1/").unwrap(),
            hub: Arc::new(RealtimeHub::new()),
        }
    }

    #[tokio::test]
    async fn test_create_admin_validation_fail() {
        let state = setup_test_state().await;
        
        // Invalid email, short password, no symbols
        let payload = CreateAdminRequest {
            email: "invalid-email".to_string(),
            full_name: "Ad".to_string(),
            password: "123".to_string(),
        };

        let result = create_admin_user(State(state), Json(payload)).await;
        
        assert!(result.is_err(), "Should fail validation");
        if let Err(ApiError::Validation(_)) = result {
            // Success
        } else {
            panic!("Expected Validation error, got: {:?}", result.unwrap_err());
        }
    }

    #[tokio::test]
    async fn test_create_admin_password_complexity() {
        let state = setup_test_state().await;
        
        // Valid email, but password lacks special char
        let payload = CreateAdminRequest {
            email: format!("admin_{}@test.com", Uuid::new_v4()),
            full_name: "Admin User".to_string(),
            password: "Password123".to_string(),
        };

        let result = create_admin_user(State(state), Json(payload)).await;
        
        assert!(result.is_err(), "Should fail complexity check");
    }

    #[tokio::test]
    async fn test_create_admin_success() {
        let state = setup_test_state().await;
        let email = format!("admin_{}@test.com", Uuid::new_v4());
        
        let payload = CreateAdminRequest {
            email: email.clone(),
            full_name: "Admin Success".to_string(),
            password: "SecurePass!123".to_string(),
        };

        let result = create_admin_user(State(state.clone()), Json(payload)).await;
        
        assert!(result.is_ok(), "Admin creation should succeed with valid data");
        
        // Verify in DB
        let user = sqlx::query!("SELECT role as \"role!: crate::models::user::UserRole\" FROM users WHERE email = $1", email)
            .fetch_one(&state.pool).await.expect("Admin should exist");
        
        assert_eq!(user.role.to_string(), "ADMIN");
    }
}
