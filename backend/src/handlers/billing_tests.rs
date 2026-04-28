#[cfg(test)]
mod tests {
    use axum::{extract::{State, Query}, Json, Extension};
    use crate::AppState;
    use crate::handlers::billing::{get_subscription, SubscriptionQuery};
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
    async fn test_get_subscription_not_found_safety() {
        let state = setup_test_state().await;
        let user_id = Uuid::new_v4();
        
        let claims = Claims {
            sub: user_id,
            exp: 9999999999,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
        };

        let result = get_subscription(
            State(state.clone()),
            Extension(claims),
            Query(SubscriptionQuery { project_id: None })
        ).await;

        assert!(result.is_err());
        match result.unwrap_err() {
            ApiError::NotFound(_) => (),
            e => panic!("Expected NotFound for new user without sub, got: {:?}", e),
        }
    }

    #[tokio::test]
    async fn test_subscription_isolation_per_project_idor_check() {
        let state = setup_test_state().await;
        let owner_a_id = Uuid::new_v4();
        let attacker_b_id = Uuid::new_v4();
        let project_a_id = Uuid::new_v4();

        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", owner_a_id, format!("owner_{}@test.com", owner_a_id)).execute(&state.pool).await.unwrap();
        sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", attacker_b_id, format!("attacker_{}@test.com", attacker_b_id)).execute(&state.pool).await.unwrap();
        
        // Insert project first to satisfy FK
        sqlx::query!("INSERT INTO projects (id, client_id, title) VALUES ($1, $2, 'Project A')", project_a_id, owner_a_id).execute(&state.pool).await.unwrap();

        sqlx::query!(
            "INSERT INTO subscriptions (client_id, project_id, plan_name, status) VALUES ($1, $2, 'PLATINUM', 'active')",
            owner_a_id, project_a_id
        ).execute(&state.pool).await.unwrap();

        let claims_attacker = Claims {
            sub: attacker_b_id,
            exp: 9999999999,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
        };

        // 1. Attacker attempts to fetch User A's subscription (IDOR)
        let result = get_subscription(
            State(state.clone()),
            Extension(claims_attacker),
            Query(SubscriptionQuery { project_id: Some(project_a_id) })
        ).await;
        
        assert!(result.is_err(), "Attacker should NOT be able to access Owner's subscription");
        match result.unwrap_err() {
            ApiError::NotFound(_) => (),
            e => panic!("Expected NotFound/Unauthorized, got {:?}", e),
        }
    }
}
