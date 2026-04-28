#[cfg(test)]
mod tests {
    use axum::{extract::{State, Path}, Extension, Json};
    use crate::AppState;
    use crate::handlers::project::{get_project, update_project_requirements};
    use crate::models::project::{Project, RequirementsPayload};
    use crate::utils::{error::ApiError, jwt::Claims};
    use uuid::Uuid;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use crate::utils::realtime::RealtimeHub;

    async fn setup_test_state() -> AppState {
        dotenvy::from_filename(".env.test").ok();
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
    async fn test_get_project_ownership_validation_vulnerability_check() {
        let state = setup_test_state().await;
        
        // 1. Create a project belonging to User A
        let user_a_id = Uuid::new_v4();
        let user_b_id = Uuid::new_v4();
        
        // Insert dummy users and project directly into test DB
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", user_a_id, format!("a_{}@test.com", user_a_id)).execute(&state.pool).await.unwrap();
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", user_b_id, format!("b_{}@test.com", user_b_id)).execute(&state.pool).await.unwrap();
        
        let project_id = Uuid::new_v4();
        sqlx::query!(
            "INSERT INTO projects (id, client_id, title, status) VALUES ($1, $2, 'Owner A Project', 'DRAFT')",
            project_id, user_a_id
        ).execute(&state.pool).await.unwrap();

        // 2. Attempt to access Project A as User B (IDOR Attack Simulation)
        let claims_user_b = Claims {
            sub: user_b_id,
            exp: 9999999999,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
        };

        let result = get_project(
            State(state.clone()),
            Extension(claims_user_b),
            Path(project_id)
        ).await;

        // 3. Verification: Should return Unauthorized or NotFound (locked by WHERE clause)
        assert!(result.is_err(), "User B should NOT be able to access User A's project");
        match result.unwrap_err() {
            ApiError::NotFound(_) => (), // Correct: query returns none because of WHERE p.client_id = $2
            _ => panic!("Expected NotFound/Unauthorized error for cross-user access"),
        }
    }

    #[tokio::test]
    async fn test_update_requirements_ownership_protection() {
        let state = setup_test_state().await;
        
        let user_a_id = Uuid::new_v4();
        let user_b_id = Uuid::new_v4();
        let project_id = Uuid::new_v4();

        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", user_a_id, format!("a_{}@test.com", user_a_id)).execute(&state.pool).await.unwrap();
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", user_b_id, format!("b_{}@test.com", user_b_id)).execute(&state.pool).await.unwrap();
        
        sqlx::query!(
            "INSERT INTO projects (id, client_id, title, status, client_edit_allowed) VALUES ($1, $2, 'Lock Test', 'DRAFT', true)",
            project_id, user_a_id
        ).execute(&state.pool).await.unwrap();

        // Attempt update requirements as User B
        let claims_user_b = Claims {
            sub: user_b_id,
            exp: 9999999999,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
        };

        let result = update_project_requirements(
            State(state.clone()),
            Extension(claims_user_b),
            Path(project_id),
            Json(RequirementsPayload {
                payment_setup: None,
                features: vec![],
                sitemap: vec![],
                custom_needs: Some("Hacked!".to_string()),
                brand_assets: None,
                domain_requested: None,
                domain_2: None,
                domain_3: None,
                competitor_ref: None,
                social_media: None,
                business_email: None,
                business_address: None,
                operation_hours: None,
                project_vision: None,
            })
        ).await;

        assert!(result.is_err(), "User B should NOT be able to update User A's project requirements");
    }
}
