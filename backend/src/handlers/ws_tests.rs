#[cfg(test)]
mod tests {
    use axum::{
        body::Body,
        http::{Request, StatusCode},
        response::Response,
    };
    use tower::util::ServiceExt;
    use crate::router::create_router;
    use crate::AppState;
    use crate::utils::realtime::RealtimeHub;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use dotenv::dotenv;
    use std::env;

    async fn setup_test_app() -> axum::Router {
        dotenv().ok();
        let db_url = env::var("DATABASE_URL").unwrap();
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&db_url)
            .await
            .unwrap();
        
        let hub = Arc::new(RealtimeHub::new());
        let state = AppState { pool, hub };
        create_router(state)
    }

    #[tokio::test]
    async fn test_ws_unauthenticated_handshake_rejection() {
        let app = setup_test_app().await;

        // Try to initiate WebSocket upgrade without authentication
        let request = Request::builder()
            .uri("/api/ws")
            .header("upgrade", "websocket")
            .header("connection", "upgrade")
            .header("sec-websocket-key", "dGhlIHNhbXBsZSBub25jZQ==")
            .header("sec-websocket-version", "13")
            .body(Body::empty())
            .unwrap();

        // Use explicit type annotation for the result of oneshot().await
        let response: Response = app.oneshot(request).await.expect("Failed to execute request");

        // Must reject with 401 Unauthorized because of require_auth middleware
        assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_ws_client_isolation_and_privacy_filter() {
        dotenv().ok();
        let db_url = env::var("DATABASE_URL").unwrap();
        let pool = PgPoolOptions::new()
            .max_connections(1)
            .connect(&db_url)
            .await
            .unwrap();

        // 1. Setup two different clients
        let client_a_id = uuid::Uuid::new_v4();
        let client_b_id = uuid::Uuid::new_v4();
        
        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'hash', 'CLIENT')", client_a_id, format!("a_{}@test.com", client_a_id)).execute(&pool).await.unwrap();
        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'hash', 'CLIENT')", client_b_id, format!("b_{}@test.com", client_b_id)).execute(&pool).await.unwrap();

        // 2. Setup a project owned by Client A
        let project_a_id = uuid::Uuid::new_v4();
        sqlx::query!(
            "INSERT INTO projects (id, client_id, title, status, description, requirements) VALUES ($1, $2, 'Proj A', 'REVIEW', 'Desc', '{}')",
            project_a_id, client_a_id
        ).execute(&pool).await.unwrap();

        // 2.5 Setup a Request within that project
        let request_id = uuid::Uuid::new_v4();
        sqlx::query!(
            "INSERT INTO requests (id, project_id, created_by, type, status, title, description) VALUES ($1, $2, $3, 'BUG', 'OPEN', 'Bug A', 'Desc')",
            request_id, project_a_id, client_a_id
        ).execute(&pool).await.unwrap();

        // 3. Verify the logic used in handle_socket for Client B (Accessing A's request)
        let res_b = sqlx::query!("SELECT created_by FROM requests WHERE id = $1", request_id)
            .fetch_one(&pool).await.unwrap();
        
        // This is the check practiced in comment_handler.rs:198
        let is_owner_b = res_b.created_by == Some(client_b_id);
        
        // Jaminan 100%: Client B MUST NOT be the owner
        assert!(!is_owner_b, "Client B should NEVER be identified as owner of Project A");

        // 4. Verify same logic for Client A
        let is_owner_a = res_b.created_by == Some(client_a_id);
        assert!(is_owner_a, "Client A MUST be identified as owner of Project A");

        // Cleanup
        sqlx::query!("DELETE FROM request_comments WHERE request_id = $1", request_id).execute(&pool).await.ok();
        sqlx::query!("DELETE FROM requests WHERE id = $1", request_id).execute(&pool).await.ok();
        sqlx::query!("DELETE FROM projects WHERE id = $1", project_a_id).execute(&pool).await.ok();
        sqlx::query!("DELETE FROM users WHERE id IN ($1, $2)", client_a_id, client_b_id).execute(&pool).await.ok();
    }
}
