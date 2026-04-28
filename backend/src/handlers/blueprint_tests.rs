#[cfg(test)]
mod tests {
    use crate::handlers::project::update_project_requirements;
    use crate::models::project::{RequirementsPayload, ProjectStatus};
    use crate::AppState;
    use crate::utils::jwt::Claims;
    use crate::utils::realtime::RealtimeHub;
    use axum::{Json, Extension};
    use axum::extract::{State, Path};
    use sqlx::PgPool;
    use uuid::Uuid;
    use std::env;
    use std::sync::Arc;

    async fn setup_test_state() -> AppState {
        dotenv::dotenv().ok();
        let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env.test");
        let pool = PgPool::connect(&db_url).await.unwrap();
        let hub = Arc::new(RealtimeHub::new());
        AppState { 
            pool, 
            redis: redis::Client::open("redis://127.0.0.1/").unwrap(),
            hub 
        }
    }

    #[tokio::test]
    async fn test_reproduce_blueprint_sync_error_via_router() {
        dotenv::dotenv().ok();
        let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");
        let pool = PgPool::connect(&db_url).await.unwrap();
        
        // 1. Setup Test Data
        let project_id = Uuid::new_v4();
        let client_id = Uuid::new_v4();
        
        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'hash', 'CLIENT')", 
            client_id, format!("blueprint_user_{}@test.com", client_id))
            .execute(&pool).await.unwrap();

        sqlx::query!(
            r#"INSERT INTO projects (id, client_id, title, status, client_edit_allowed) VALUES ($1, $2, 'Test Project', 'DRAFT'::project_status, TRUE)"#,
            project_id, client_id
        ).execute(&pool).await.unwrap();

        // 2. Setup App State and Router
        let redis_url = std::env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string());
        let redis_client = redis::Client::open(redis_url).unwrap();
        let state = crate::AppState {
            pool: pool.clone(),
            redis: redis_client,
            hub: std::sync::Arc::new(crate::utils::realtime::RealtimeHub::new()),
        };
        let app = crate::router::create_router(state);

        // 3. Create Tokens
        let token = crate::utils::jwt::create_token(client_id, "CLIENT".to_string(), true).unwrap();
        let csrf_token = "test_csrf_token";

        // 4. Create Request (WITH Cookie and CSRF Header)
        let payload = serde_json::json!({
            "features": ["Feature 1"],
            "sitemap": ["Page 1"]
        });

        use axum::http::{Request, Method, header};
        use tower::ServiceExt;

        let req = Request::builder()
            .method(Method::PATCH)
            .uri(format!("/api/projects/{}/requirements", project_id))
            .header(header::CONTENT_TYPE, "application/json")
            .header(header::COOKIE, format!("auth_token={}; csrf_token={}", token, csrf_token))
            .header("X-CSRF-Token", csrf_token)
            .body(axum::body::Body::from(serde_json::to_string(&payload).unwrap()))
            .unwrap();

        // 5. Execute
        let response = app.oneshot(req).await.unwrap();

        // 6. Assert Success
        let status = response.status();
        println!("DIAGNOSTIC: Response Status: {}", status);
        
        assert!(status.is_success(), "Expected blueprint sync to succeed after fix, but got status {}. Check if middleware or handler logic is failing.", status);
    }

    #[test]
    fn test_csrf_cookie_config_detect_httponly_bug() {
        let token = "test_token".to_string();
        let cookie = crate::utils::cookie::build_csrf_cookie(token);
        let cookie_str = cookie.to_string();
        
        // This is the CRITICAL check. If this fails, the frontend CANNOT read the token.
        assert!(!cookie_str.to_lowercase().contains("httponly"), "SECURITY/FUNCTIONAL BUG: CSRF cookie MUST NOT be HttpOnly. If it is HttpOnly, frontend JavaScript cannot read it to include it in the X-CSRF-Token header, causing '403 Forbidden' errors during Strategic Blueprint Synchronization.");
    }
}
