#[cfg(test)]
mod tests {
    use axum::{extract::State, Json, Extension, extract::Path};
    use crate::AppState;
    use crate::handlers::comment_handler::{create_comment, get_comments};
    use crate::models::requests::{CreateCommentRequest};
    use crate::utils::{error::ApiError, jwt::Claims};
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
    async fn test_comment_idor_protection_unauthorized_access() {
        let state = setup_test_state().await;
        
        let owner_id = Uuid::new_v4();
        let attacker_id = Uuid::new_v4();
        let project_id = Uuid::new_v4();
        let ticket_id = Uuid::new_v4();

        // 1. Setup Owner, Attacker, Project, and Ticket
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", owner_id, format!("owner_{}@test.com", owner_id)).execute(&state.pool).await.unwrap();
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", attacker_id, format!("attacker_{}@test.com", attacker_id)).execute(&state.pool).await.unwrap();
        
        sqlx::query!(
            "INSERT INTO projects (id, client_id, title) VALUES ($1, $2, 'Private Project')",
            project_id, owner_id
        ).execute(&state.pool).await.unwrap();

        sqlx::query!(
            "INSERT INTO requests (id, project_id, created_by, title, description, type) VALUES ($1, $2, $3, 'Owner Secret', 'Dont see this', 'BUG')",
            ticket_id, project_id, owner_id
        ).execute(&state.pool).await.unwrap();

        // 2. Attacker attempts to GET comments for Owner's ticket
        let claims_attacker = Claims {
            sub: attacker_id,
            exp: 9999999999,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
        };

        let get_result = get_comments(
            State(state.clone()),
            Extension(claims_attacker.clone()),
            Path(ticket_id)
        ).await;

        // 3. Verification: Must be Unauthorized
        assert!(get_result.is_err(), "Attacker should NOT be able to view comments of another user's ticket");
        match get_result.unwrap_err() {
            ApiError::Unauthorized => (),
            e => panic!("Expected Unauthorized (401/403) for IDOR comment leak, got: {:?}", e),
        }

        // 4. Attacker attempts to POST a comment to Owner's ticket
        let post_result = create_comment(
            State(state.clone()),
            Extension(claims_attacker),
            Path(ticket_id),
            Json(CreateCommentRequest {
                message: "Sneaky comment".to_string(),
                attachment_urls: None,
            })
        ).await;

        assert!(post_result.is_err(), "Attacker should NOT be able to post comments on another user's ticket");
        match post_result.unwrap_err() {
            ApiError::Unauthorized => (),
            e => panic!("Expected Unauthorized for IDOR comment injection, got: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_admin_can_access_any_comment_thread() {
        let state = setup_test_state().await;
        let owner_id = Uuid::new_v4();
        let admin_id = Uuid::new_v4();
        let ticket_id = Uuid::new_v4();
        let project_id = Uuid::new_v4();

        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", owner_id, format!("owner_{}@test.com", owner_id)).execute(&state.pool).await.unwrap();
        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'hash', 'ADMIN')", admin_id, format!("admin_{}@test.com", admin_id)).execute(&state.pool).await.unwrap();
        
        sqlx::query!("INSERT INTO projects (id, client_id, title) VALUES ($1, $2, 'Admin Project')", project_id, owner_id).execute(&state.pool).await.unwrap();
        sqlx::query!(
            "INSERT INTO requests (id, project_id, created_by, title, description, type) VALUES ($1, $2, $3, 'Admin View', 'Help', 'BUG')",
            ticket_id, project_id, owner_id
        ).execute(&state.pool).await.unwrap();

        let claims_admin = Claims {
            sub: admin_id,
            exp: 9999999999,
            role: "ADMIN".to_string(),
            is_2fa_verified: true,
        };

        let result = get_comments(
            State(state.clone()),
            Extension(claims_admin),
            Path(ticket_id)
        ).await;

        assert!(result.is_ok(), "Admin must have high-level access to all comment threads");
    }
}
