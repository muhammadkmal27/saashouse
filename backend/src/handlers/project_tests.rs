#[cfg(test)]
mod tests {
    use crate::handlers::project::create_project;
    use crate::models::project::{CreateProjectRequest, RequirementsPayload, ProjectStatus};
    use crate::AppState;
    use crate::utils::jwt::Claims;
    use crate::utils::realtime::RealtimeHub;
    use axum::{Json, Extension};
    use sqlx::PgPool;
    use uuid::Uuid;
    use std::env;
    use std::sync::Arc;

    async fn setup_test_state() -> AppState {
        dotenv::dotenv().ok();
        let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env.test");
        let pool = PgPool::connect(&db_url).await.unwrap();
        let hub = Arc::new(RealtimeHub::new());
        AppState { pool, hub }
    }

    #[tokio::test]
    async fn test_create_project_initial_status_review() {
        let state = setup_test_state().await;
        let user_id = Uuid::new_v4();
        
        // Insert user to satisfy foreign key constraint
        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'hash', 'CLIENT')", 
            user_id, format!("proj_user_{}@test.com", user_id))
            .execute(&state.pool).await.unwrap();

        let payload = CreateProjectRequest {
            title: "Test Project Official".to_string(),
            description: Some("Test Desc".to_string()),
            whatsapp_number: "60123456789".to_string(),
            requirements: RequirementsPayload {
                payment_setup: None,
                features: vec!["Auth".to_string()],
                custom_needs: None,
                sitemap: vec!["Home".to_string()],
                brand_assets: None,
                domain_requested: Some("test.com".to_string()),
                domain_2: None,
                domain_3: None,
                competitor_ref: None,
                social_media: None,
                business_email: None,
                business_address: None,
                operation_hours: None,
                project_vision: None,
            },
            selected_plan: Some("Growth".to_string()),
        };

        let claims = Claims {
            sub: user_id,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
            exp: 9999999999,
        };

        let result = create_project(axum::extract::State(state), Extension(claims), Json(payload)).await;
        
        if let Err(ref e) = result {
            eprintln!("CREATE PROJECT ERROR: {:?}", e);
        }
        assert!(result.is_ok());
        let Json(project) = result.unwrap();
        assert!(matches!(project.status, ProjectStatus::Review));
    }
}
