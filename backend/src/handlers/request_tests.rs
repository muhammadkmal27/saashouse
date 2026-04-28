#[cfg(test)]
mod tests {
    use axum::{extract::{State, Path}, Json, Extension};
    use crate::AppState;
    use crate::handlers::request_handler::{create_request, update_request_status};
    use crate::models::requests::{CreateRequest, RequestType, UpdateStatusRequest, RequestStatus};
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
    async fn test_create_request_unauthorized_project_access_vulnerability() {
        let state = setup_test_state().await;
        
        let owner_id = Uuid::new_v4();
        let attacker_id = Uuid::new_v4();
        let project_id = Uuid::new_v4();

        // 1. Setup owner and project
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", owner_id, format!("owner_{}@test.com", owner_id)).execute(&state.pool).await.unwrap();
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", attacker_id, format!("attacker_{}@test.com", attacker_id)).execute(&state.pool).await.unwrap();
        
        sqlx::query!(
            "INSERT INTO projects (id, client_id, title, status) VALUES ($1, $2, 'Private Project', 'DRAFT')",
            project_id, owner_id
        ).execute(&state.pool).await.unwrap();

        // 2. Attacker attempts to create a ticket for Owner's project
        let claims_attacker = Claims {
            sub: attacker_id,
            exp: 9999999999,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
        };

        let result = create_request(
            State(state.clone()),
            Extension(claims_attacker),
            Json(CreateRequest {
                project_id,
                type_: RequestType::BUG,
                title: "Hacked!".to_string(),
                description: "I am adding a ticket to your project!".to_string(),
                attachment_urls: None,
            })
        ).await;

        // 3. Verification: Must be Unauthorized
        assert!(result.is_err(), "Attacker should NOT be able to create a ticket for another user's project");
        match result.unwrap_err() {
            ApiError::Unauthorized => (),
            e => panic!("Expected Unauthorized error, got: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_admin_only_status_update_enforcement() {
        let state = setup_test_state().await;
        
        let client_id = Uuid::new_v4();
        let ticket_id = Uuid::new_v4();
        let project_id = Uuid::new_v4();

        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", client_id, format!("client_{}@test.com", client_id)).execute(&state.pool).await.unwrap();
        
        sqlx::query!(
            "INSERT INTO projects (id, client_id, title, status) VALUES ($1, $2, 'Test Project', 'DRAFT')",
            project_id, client_id
        ).execute(&state.pool).await.unwrap();

        sqlx::query!(
            "INSERT INTO requests (id, project_id, created_by, title, description, type) VALUES ($1, $2, $3, 'Fix me', 'Help!', 'BUG')",
            ticket_id, project_id, client_id
        ).execute(&state.pool).await.unwrap();

        // 1. Client attempts to update their own ticket status (Prohibited)
        let claims_client = Claims {
            sub: client_id,
            exp: 9999999999,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
        };

        let result = update_request_status(
            State(state.clone()),
            Extension(claims_client),
            Path(ticket_id),
            Json(UpdateStatusRequest {
                status: RequestStatus::Resolved,
            })
        ).await;

        assert!(result.is_err(), "Client should NOT be able to update ticket status even if it is their own");
        match result.unwrap_err() {
            ApiError::Unauthorized => (),
            e => panic!("Expected Unauthorized for client status update, got: {:?}", e),
        }

        // 2. Admin attempts update (Allowed)
        let admin_id = Uuid::new_v4();
        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'hash', 'ADMIN')", admin_id, format!("admin_{}@test.com", admin_id)).execute(&state.pool).await.unwrap();

        let claims_admin = Claims {
            sub: admin_id,
            exp: 9999999999,
            role: "ADMIN".to_string(),
            is_2fa_verified: true,
        };

        let result_admin = update_request_status(
            State(state.clone()),
            Extension(claims_admin),
            Path(ticket_id),
            Json(UpdateStatusRequest {
                status: RequestStatus::InProgress,
            })
        ).await;

        assert!(result_admin.is_ok(), "Admin should be allowed to update ticket status");
    }
}
