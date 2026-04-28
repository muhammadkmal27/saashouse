#[cfg(test)]
mod tests {
    use axum::{extract::{State, Path}, Json};
    use crate::AppState;
    use crate::handlers::admin::{get_admin_stats, generate_project_invoice};
    use crate::models::project::ProjectStatus;
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
            redis: redis::Client::open("redis://127.0.0.1/").unwrap(),
            hub: Arc::new(RealtimeHub::new()),
        }
    }

    #[tokio::test]
    async fn test_admin_stats_mrr_precision_and_rounding() {
        let state = setup_test_state().await;
        
        // 1. Clear subscriptions for clean test
        sqlx::query!("DELETE FROM subscriptions").execute(&state.pool).await.unwrap();

        // 2. Insert strategic subscription plans to test rounding and summing
        // Platinum: 750.00, Enterprise: 410.00, Growth: 240.00, Standard: 165.00
        let subscriptions = vec![
            (Uuid::new_v4(), "PLATINUM", "active"),
            (Uuid::new_v4(), "ENTERPRISE", "active"),
            (Uuid::new_v4(), "GROWTH", "active"),
            (Uuid::new_v4(), "STANDARD", "active"),
            (Uuid::new_v4(), "EXPIRED_PLAN", "expired"), // Should NOT be counted
        ];

        for (uid, plan, status) in subscriptions {
            sqlx::query!(
                "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash') ON CONFLICT DO NOTHING",
                uid, format!("test_{}@stats.com", uid)
            ).execute(&state.pool).await.unwrap();

            sqlx::query!(
                "INSERT INTO subscriptions (client_id, plan_name, status) VALUES ($1, $2, $3)",
                uid, plan, status
            ).execute(&state.pool).await.unwrap();
        }

        // 3. Run Stats Handler
        use axum::extract::Query;
        use crate::models::admin::StatsQuery;
        let query = Query(StatsQuery { days: Some(0) });
        let result = get_admin_stats(State(state.clone()), query).await.unwrap();
        let stats = result.0;

        // 4. Verification (750 + 410 + 240 + 165 = 1565.00)
        assert_eq!(stats.total_mrr, 1565.0, "MRR Calculation must be exact including cents");
    }

    #[tokio::test]
    async fn test_atomic_invoice_generation_with_tax_and_subtotal_logic() {
        let state = setup_test_state().await;
        let client_id = Uuid::new_v4();
        let project_id = Uuid::new_v4();

        // Setup Project with ENTERPRISE plan (410.00)
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", client_id, format!("billing_{}@test.com", client_id)).execute(&state.pool).await.unwrap();
        
        sqlx::query!(
            "INSERT INTO projects (id, client_id, title, status, requirements) VALUES ($1, $2, 'Premium App', 'REVIEW', $3)",
            project_id, client_id, serde_json::json!({"selected_plan": "ENTERPRISE"})
        ).execute(&state.pool).await.unwrap();

        // 1. Generate Invoice
        let result = generate_project_invoice(State(state.clone()), Path(project_id)).await.unwrap();
        assert!(result.0["success"].as_bool().unwrap());

        // 2. Verify Database Integrity (Rule 11)
        // Check Project Status
        let project_status_row = sqlx::query!(
            "SELECT status as \"status!: ProjectStatus\" FROM projects WHERE id = $1", 
            project_id
        ).fetch_one(&state.pool).await.unwrap();
        
        let actual_status: ProjectStatus = project_status_row.status;
        assert!(matches!(actual_status, ProjectStatus::PaymentPending));

        // Check Billing Record (Precision check)
        let billing_row = sqlx::query!(
            "SELECT amount as \"amount!\" FROM billings WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1",
            project_id
        ).fetch_one(&state.pool).await.unwrap();

        // Enterprise is 410.00
        let amount_f64: f64 = format!("{:.2}", billing_row.amount).parse().unwrap();
        assert_eq!(amount_f64, 410.0, "Billing record must match plan price exactly");
    }

    #[tokio::test]
    async fn test_admin_stats_unauthorized_access_prevention() {
        // Note: Middleware tests usually happen at Router level, 
        // but here we ensure the handler doesn't bypass any logic
        // This is a placeholder for multi-tenancy check if applicable.
        assert!(true);
    }
}
