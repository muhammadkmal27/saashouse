#[cfg(test)]
mod tests {
    use axum::{extract::{State, Path}, Json};
    use crate::AppState;
    use crate::handlers::admin::{get_admin_stats, generate_project_invoice};
    use crate::handlers::settings::{update_setting, UpdateSettingRequest};
    use crate::models::admin::StatsQuery;
    use crate::utils::jwt::Claims;
    use uuid::Uuid;
    use sqlx::postgres::PgPoolOptions;
    use std::sync::Arc;
    use crate::utils::realtime::RealtimeHub;

    async fn setup_test_state() -> AppState {
        dotenv::from_filename(".env.test").ok();
        let db_url = std::env::var("DATABASE_URL").expect("DATABASE_URL in .env.test");
        let pool = PgPoolOptions::new()
            .max_connections(5)
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
    async fn test_dynamic_pricing_impact_on_mrr_and_invoices() {
        let state = setup_test_state().await;
        
        // 1. Clear database
        sqlx::query!("DELETE FROM subscriptions").execute(&state.pool).await.unwrap();
        sqlx::query!("DELETE FROM billings").execute(&state.pool).await.unwrap();
        sqlx::query!("DELETE FROM projects").execute(&state.pool).await.unwrap();
        sqlx::query!("DELETE FROM users WHERE email LIKE '%test.com' OR email LIKE '%saas.com'").execute(&state.pool).await.unwrap();
        sqlx::query!("DELETE FROM system_settings").execute(&state.pool).await.unwrap();

        // 2. Set custom prices in system_settings
        let custom_prices = serde_json::json!({
            "Standard": "200.00",
            "Growth": "300.00",
            "Enterprise": "500.00",
            "Platinum": "1000.00"
        });

        let admin_claims = Claims {
            sub: Uuid::new_v4(),
            role: "ADMIN".to_string(),
            exp: 9999999999,
            is_2fa_verified: true,
        };

        let _ = update_setting(
            State(state.clone()),
            axum::Extension(admin_claims.clone()),
            axum::extract::Path("package_prices".to_string()),
            Json(UpdateSettingRequest { value: custom_prices })
        ).await.expect("Failed to update custom prices");

        // 3. Test MRR Calculation with custom prices
        let uid = Uuid::new_v4();
        sqlx::query!(
            "INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash') ON CONFLICT DO NOTHING",
            uid, "mrr_test@saas.com"
        ).execute(&state.pool).await.unwrap();

        sqlx::query!(
            "INSERT INTO subscriptions (client_id, plan_name, status) VALUES ($1, 'PLATINUM', 'active')",
            uid
        ).execute(&state.pool).await.unwrap();

        use axum::extract::Query;
        let stats_result = get_admin_stats(State(state.clone()), Query(StatsQuery { days: Some(0) })).await.unwrap();
        assert_eq!(stats_result.0.total_mrr, 1000.0, "MRR should reflect custom Platinum price (1000.0)");

        // 4. Test Invoice Generation with custom prices
        let project_id = Uuid::new_v4();
        sqlx::query!(
            "INSERT INTO projects (id, client_id, title, status, requirements) VALUES ($1, $2, 'Dynamic Project', 'REVIEW', $3)",
            project_id, uid, serde_json::json!({"selected_plan": "ENTERPRISE"})
        ).execute(&state.pool).await.unwrap();

        let _ = generate_project_invoice(State(state.clone()), Path(project_id)).await.expect("Failed to generate invoice");

        let billing_row = sqlx::query!(
            "SELECT amount as \"amount!\" FROM billings WHERE project_id = $1 ORDER BY created_at DESC LIMIT 1",
            project_id
        ).fetch_one(&state.pool).await.unwrap();

        let amount_f64: f64 = billing_row.amount.to_string().parse().unwrap();
        assert_eq!(amount_f64, 500.0, "Invoice should reflect custom Enterprise price (500.0)");
    }
}
