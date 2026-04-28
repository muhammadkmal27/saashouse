#[cfg(test)]
mod tests {
    use crate::handlers::auth::otp::verify_2fa_logic;
    use crate::models::auth::Verify2FARequest;
    use crate::utils::jwt::create_token;
    use crate::AppState;
    use crate::utils::realtime::RealtimeHub;
    use axum_extra::extract::cookie::{Cookie, CookieJar};
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
    async fn test_verify_2fa_success() {
        let state = setup_test_state().await;
        let admin_id = Uuid::new_v4();
        let otp_code = "123456".to_string();

        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'hash', 'ADMIN')", admin_id, format!("admin_{}@test.com", admin_id)).execute(&state.pool).await.unwrap();

        let expires_at = chrono::Utc::now() + chrono::Duration::try_minutes(5).unwrap();
        sqlx::query!("INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)", admin_id, otp_code, expires_at).execute(&state.pool).await.unwrap();

        let token = create_token(admin_id, "ADMIN".to_string(), false).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));

        let payload = Verify2FARequest { code: otp_code };
        let result = verify_2fa_logic(state.pool.clone(), jar, payload).await;

        assert!(result.is_ok());
        let (new_jar, _) = result.unwrap();
        let final_token = new_jar.get("auth_token").unwrap().value();
        let claims = crate::utils::jwt::verify_token(final_token).unwrap();
        assert!(claims.is_2fa_verified);
    }

    #[tokio::test]
    async fn test_verify_2fa_wrong_code() {
        let state = setup_test_state().await;
        let admin_id = Uuid::new_v4();
        
        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, 'hash', 'ADMIN')", admin_id, format!("admin2_{}@test.com", admin_id)).execute(&state.pool).await.unwrap();
        
        let token = create_token(admin_id, "ADMIN".to_string(), false).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));
        let payload = Verify2FARequest { code: "000000".to_string() };

        let result = verify_2fa_logic(state.pool.clone(), jar, payload).await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn test_verify_2fa_forbidden_for_client() {
        let state = setup_test_state().await;
        let client_id = Uuid::new_v4();
        
        let token = create_token(client_id, "CLIENT".to_string(), false).unwrap();
        let jar = CookieJar::new().add(Cookie::new("auth_token", token));
        let payload = Verify2FARequest { code: "123456".to_string() };

        let result = verify_2fa_logic(state.pool.clone(), jar, payload).await;
        assert!(match result {
            Err(crate::utils::error::ApiError::Forbidden(_)) => true,
            _ => false,
        });
    }
}
