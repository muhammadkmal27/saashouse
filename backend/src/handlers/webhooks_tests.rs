#[cfg(test)]
mod tests {
    use axum::{extract::State, http::HeaderMap, body::Bytes};
    use crate::AppState;
    use crate::handlers::webhooks::handle_stripe_webhook;
    use crate::models::project::ProjectStatus;
    use uuid::Uuid;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use crate::utils::realtime::RealtimeHub;
    use serde_json::json;

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
    async fn test_webhook_idempotency_duplicate_event_bypass() {
        let state = setup_test_state().await;
        let event_id = format!("evt_{}", Uuid::new_v4());
        let project_id = Uuid::new_v4();
        let user_id = Uuid::new_v4();

        // Setup user and project
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", user_id, format!("webhook_{}@test.com", user_id)).execute(&state.pool).await.unwrap();
        sqlx::query!("INSERT INTO projects (id, client_id, title, status) VALUES ($1, $2, 'Test Proj', 'PAYMENT_PENDING')", project_id, user_id).execute(&state.pool).await.unwrap();

        let payload = json!({
            "id": event_id,
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": "cs_test_123",
                    "subscription": "sub_test_123",
                    "metadata": {
                        "project_id": project_id.to_string(),
                        "user_id": user_id.to_string(),
                        "plan_name": "PLATINUM"
                    }
                }
            }
        }).to_string();

        let mut headers = HeaderMap::new();
        headers.insert("stripe-signature", "t=123,v1=dummy".parse().unwrap());
        
        // Skip signature check in test if STRIPE_WEBHOOK_SECRET is not set or we mock it
        std::env::set_var("STRIPE_WEBHOOK_SECRET", ""); 

        // 1. First call - Should process
        let body1 = Bytes::from(payload.clone());
        let result1 = handle_stripe_webhook(State(state.clone()), headers.clone(), body1).await;
        if let Err(e) = &result1 {
            println!("Webhook 1 Failed with: {:?}", e);
        }
        assert!(result1.is_ok(), "First webhook should succeed");

        // Verify state changed to Paid
        let project = sqlx::query!("SELECT status as \"status!: ProjectStatus\" FROM projects WHERE id = $1", project_id)
            .fetch_one(&state.pool).await.unwrap();
        assert!(matches!(project.status, ProjectStatus::Paid));

        // 2. Second call with SAME event_id - Should bypass
        let body2 = Bytes::from(payload);
        let result2 = handle_stripe_webhook(State(state.clone()), headers, body2).await;
        assert!(result2.is_ok(), "Second webhook with same ID should return OK (idempotent)");

        // Verify count of processed_webhooks is exactly 1
        let count = sqlx::query!("SELECT COUNT(*) as count FROM processed_webhooks WHERE event_id = $1", event_id)
            .fetch_one(&state.pool).await.unwrap();
        assert_eq!(count.count.unwrap_or(0), 1, "Event should only be recorded once in database");
    }
}
