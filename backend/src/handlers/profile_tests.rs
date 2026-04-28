#[cfg(test)]
mod tests {
    use crate::handlers::profile::{update_password, UpdatePasswordRequest};
    use crate::AppState;
    use crate::utils::jwt::Claims;
    use crate::utils::realtime::RealtimeHub;
    use axum_extra::extract::cookie::CookieJar;
    use axum::{Json, Extension};
    use sqlx::PgPool;
    use uuid::Uuid;
    use std::env;
    use std::sync::Arc;
    use argon2::{
        password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
        Argon2,
    };

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
    async fn test_update_password_success() {
        let state = setup_test_state().await;
        let user_id = Uuid::new_v4();
        let old_pass = "old_password_123";
        let new_pass = "new_secure_pass!456";
        
        let salt = SaltString::generate(&mut OsRng);
        let old_hash = Argon2::default()
            .hash_password(old_pass.as_bytes(), &salt)
            .unwrap()
            .to_string();

        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, 'CLIENT')", 
            user_id, format!("user_prof_{}@test.com", user_id), old_hash)
            .execute(&state.pool).await.unwrap();

        let claims = Claims {
            sub: user_id,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
            exp: 9999999999,
        };

        let payload = UpdatePasswordRequest {
            current_password: old_pass.to_string(),
            new_password: new_pass.to_string(),
        };

        let _jar = CookieJar::new();
        let result = update_password(axum::extract::State(state.clone()), Extension(claims), Json(payload)).await;
        assert!(result.is_ok());

        let user = sqlx::query!("SELECT password_hash FROM users WHERE id = $1", user_id)
            .fetch_one(&state.pool).await.unwrap();
        let new_hash_str = user.password_hash.unwrap();
        
        use argon2::PasswordVerifier;
        let parsed_hash = argon2::PasswordHash::new(&new_hash_str).unwrap();
        assert!(Argon2::default().verify_password(new_pass.as_bytes(), &parsed_hash).is_ok());
    }

    #[tokio::test]
    async fn test_update_password_wrong_current() {
        let state = setup_test_state().await;
        let user_id = Uuid::new_v4();
        let actual_pass = "actual_secret";
        let salt = SaltString::generate(&mut OsRng);
        let actual_hash = Argon2::default().hash_password(actual_pass.as_bytes(), &salt).unwrap().to_string();

        sqlx::query!("INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, 'CLIENT')", 
            user_id, format!("user_fail_{}@test.com", user_id), actual_hash).execute(&state.pool).await.unwrap();

        let claims = Claims { sub: user_id, role: "CLIENT".to_string(), is_2fa_verified: true, exp: 9999999999 };
        let payload = UpdatePasswordRequest {
            current_password: "wrong_password".to_string(),
            new_password: "new_Complex!123".to_string(),
        };

        let result = update_password(axum::extract::State(state), Extension(claims), Json(payload)).await;
        assert!(matches!(result, Err(crate::utils::error::ApiError::Unauthorized)));
    }

    #[tokio::test]
    async fn test_update_password_oauth_first_time() {
        let state = setup_test_state().await;
        let user_id = Uuid::new_v4();
        
        // OAuth user (no password_hash)
        sqlx::query!("INSERT INTO users (id, email, password_hash, google_id, role) VALUES ($1, $2, NULL, $3, 'CLIENT')", 
            user_id, format!("user_oauth_{}@test.com", user_id), "google_123")
            .execute(&state.pool).await.unwrap();

        let claims = Claims {
            sub: user_id,
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
            exp: 9999999999,
        };

        let new_pass = "new_oauth_Pass!123";
        let payload = UpdatePasswordRequest {
            current_password: "".to_string(), // Should be ignored
            new_password: new_pass.to_string(),
        };

        let result = update_password(axum::extract::State(state.clone()), Extension(claims), Json(payload)).await;
        assert!(result.is_ok());

        let user = sqlx::query!("SELECT password_hash FROM users WHERE id = $1", user_id)
            .fetch_one(&state.pool).await.unwrap();
        let new_hash_str = user.password_hash.unwrap();
        
        use argon2::PasswordVerifier;
        let parsed_hash = argon2::PasswordHash::new(&new_hash_str).unwrap();
        assert!(Argon2::default().verify_password(new_pass.as_bytes(), &parsed_hash).is_ok());
    }
}
