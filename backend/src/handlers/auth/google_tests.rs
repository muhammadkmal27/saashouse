#[cfg(test)]
mod tests {
    use crate::handlers::auth::google::{google_callback_logic, MockGoogleOAuthClient, CallbackQuery, GoogleUserInfo};
    use crate::AppState;
    use crate::utils::error::ApiError;
    use crate::utils::realtime::RealtimeHub;
    use axum::{extract::{Query}, response::Response};
    use axum_extra::extract::cookie::{CookieJar};
    use sqlx::PgPool;
    use uuid::Uuid;
    use std::env;
    use std::sync::Arc;
    use serde_json::json;

    async fn setup_test_state() -> AppState {
        dotenv::dotenv().ok();
        let db_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env.test");
        let pool = PgPool::connect(&db_url).await.unwrap();
        let hub = Arc::new(RealtimeHub::new());
        AppState { pool, hub }
    }

    #[tokio::test]
    async fn test_google_callback_new_user_success() {
        let state = setup_test_state().await;
        let mut mock_client = MockGoogleOAuthClient::new();
        
        let google_id = "google_sub_123".to_string();
        let email = format!("google_{}@test.com", Uuid::new_v4());

        mock_client.expect_exchange_code()
            .returning(|_, _, _, _| Box::pin(async move { Ok(json!({"access_token": "mock_token"})) }));
        
        mock_client.expect_get_user_info()
            .returning(move |_| {
                let gid = google_id.clone();
                let em = email.clone();
                Box::pin(async move { 
                    Ok(GoogleUserInfo {
                        sub: gid,
                        email: em,
                        name: "Google User".to_string(),
                        picture: None,
                    })
                })
            });

        let jar = CookieJar::new();
        let query = Query(CallbackQuery { code: "test_code".to_string() });

        let result: Result<(CookieJar, Response), ApiError> = google_callback_logic(&state.pool, &mock_client, jar, query).await;
        
        assert!(result.is_ok());
        let (new_jar, _) = result.unwrap();
        assert!(new_jar.get("auth_token").is_some());
    }

    #[tokio::test]
    async fn test_google_callback_invalid_token_error() {
        let state = setup_test_state().await;
        let mut mock_client = MockGoogleOAuthClient::new();
        
        mock_client.expect_exchange_code()
            .returning(|_, _, _, _| Box::pin(async move { Err(ApiError::Internal("Invalid code".into())) }));

        let jar = CookieJar::new();
        let query = Query(CallbackQuery { code: "bad_code".to_string() });

        let result: Result<(CookieJar, Response), ApiError> = google_callback_logic(&state.pool, &mock_client, jar, query).await;
        assert!(result.is_err());
    }
}
