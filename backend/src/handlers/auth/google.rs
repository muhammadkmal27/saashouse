use axum_extra::extract::cookie::{Cookie, CookieJar};
use axum::{
    extract::{State, Query},
    response::{IntoResponse, Redirect, Response},
    Json,
};
use sqlx::{PgPool};
use serde::Deserialize;
use std::env;
use async_trait::async_trait;
use chrono::Utc;

use crate::AppState;
use crate::models::{user::{User, UserRole}};
use crate::utils::{error::ApiError, jwt::create_token};

#[derive(Deserialize)]
pub struct CallbackQuery {
    pub code: String,
}

#[derive(Deserialize, Clone)]
pub struct GoogleUserInfo {
    pub sub: String,
    pub email: String,
    pub name: String,
    pub picture: Option<String>,
}

#[async_trait]
#[cfg_attr(test, mockall::automock)]
pub trait GoogleOAuthClient: Send + Sync {
    async fn exchange_code(&self, code: &str, client_id: &str, client_secret: &str, redirect_uri: &str) -> Result<serde_json::Value, ApiError>;
    async fn get_user_info(&self, access_token: &str) -> Result<GoogleUserInfo, ApiError>;
}

pub struct RealGoogleClient;

#[async_trait]
impl GoogleOAuthClient for RealGoogleClient {
    async fn exchange_code(&self, code: &str, client_id: &str, client_secret: &str, redirect_uri: &str) -> Result<serde_json::Value, ApiError> {
        let client = reqwest::Client::new();
        let res = client.post("https://oauth2.googleapis.com/token")
            .form(&[
                ("code", code),
                ("client_id", client_id),
                ("client_secret", client_secret),
                ("redirect_uri", redirect_uri),
                ("grant_type", "authorization_code"),
            ])
            .send()
            .await
            .map_err(|e| ApiError::Internal(format!("Failed to exchange Google code: {}", e)))?;

        res.json::<serde_json::Value>().await.map_err(|e| ApiError::Internal(e.to_string()))
    }

    async fn get_user_info(&self, access_token: &str) -> Result<GoogleUserInfo, ApiError> {
        let client = reqwest::Client::new();
        let res = client.get("https://www.googleapis.com/oauth2/v3/userinfo")
            .bearer_auth(access_token)
            .send()
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        res.json::<GoogleUserInfo>().await.map_err(|e| ApiError::Internal(e.to_string()))
    }
}

pub async fn google_login_redirect() -> impl IntoResponse {
    let client_id = env::var("GOOGLE_CLIENT_ID").unwrap_or_default();
    let redirect_uri = env::var("GOOGLE_REDIRECT_URI").unwrap_or("http://localhost:8080/api/auth/google/callback".to_string());
    
    let google_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=openid%20email%20profile&access_type=offline",
        client_id, redirect_uri
    );

    Redirect::temporary(&google_url)
}

#[axum::debug_handler]
pub async fn google_callback(
    State(state): State<AppState>,
    jar: CookieJar,
    Query(query): Query<CallbackQuery>,
) -> Response {
    let oauth_client = RealGoogleClient;
    match google_callback_logic(&state.pool, &oauth_client, jar, axum::extract::Query(query)).await {
        Ok((new_jar, response)) => (new_jar, response).into_response(),
        Err(e) => e.into_response(),
    }
}

pub async fn google_callback_logic<C: GoogleOAuthClient>(
    pool: &PgPool,
    oauth_client: &C,
    jar: CookieJar,
    query: Query<CallbackQuery>,
) -> Result<(CookieJar, Response), ApiError> {
    let client_id = env::var("GOOGLE_CLIENT_ID").map_err(|_| ApiError::Internal("GOOGLE_CLIENT_ID not set".into()))?;
    let client_secret = env::var("GOOGLE_CLIENT_SECRET").map_err(|_| ApiError::Internal("GOOGLE_CLIENT_SECRET not set".into()))?;
    let redirect_uri = env::var("GOOGLE_REDIRECT_URI").unwrap_or("http://localhost:8080/api/auth/google/callback".to_string());

    let token_data = oauth_client.exchange_code(&query.code, &client_id, &client_secret, &redirect_uri).await?;
    let access_token = token_data["access_token"].as_str().ok_or(ApiError::Internal("No access token in Google response".into()))?;

    let google_user = oauth_client.get_user_info(access_token).await?;

    let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let user_by_gid = sqlx::query_as!(User, r#"SELECT id, email, password_hash, google_id, role as "role!: UserRole", is_active as "is_active!", created_at, updated_at FROM users WHERE google_id = $1"#, google_user.sub)
        .fetch_optional(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let user = if let Some(u) = user_by_gid {
        u
    } else {
        let user_by_email = sqlx::query_as!(User, r#"SELECT id, email, password_hash, google_id, role as "role!: UserRole", is_active as "is_active!", created_at, updated_at FROM users WHERE email = $1"#, google_user.email)
            .fetch_optional(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        if let Some(mut u) = user_by_email {
            sqlx::query!("UPDATE users SET google_id = $1 WHERE id = $2", google_user.sub, u.id)
                .execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;
            u.google_id = Some(google_user.sub.clone());
            u
        } else {
            let new_user = sqlx::query_as!(User, r#"
                INSERT INTO users (email, google_id, role) 
                VALUES ($1, $2, 'CLIENT') RETURNING id, email, password_hash, google_id, role as "role!: UserRole", is_active as "is_active!", created_at, updated_at
            "#, google_user.email, google_user.sub)
            .fetch_one(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

            sqlx::query!("INSERT INTO user_profiles (user_id, full_name, avatar_url) VALUES ($1, $2, $3)", 
                new_user.id, google_user.name, google_user.picture)
            .execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

            new_user
        }
    };

    tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let role_str = format!("{:?}", user.role).to_uppercase();
    let frontend_url = env::var("FRONTEND_URL").unwrap_or("http://localhost:3000".to_string());

    if user.role == UserRole::Admin {
        let otp_code: String = {
            use rand::RngExt;
            let mut rng = rand::rng();
            (0..6).map(|_| rng.random_range(0..10).to_string()).collect::<String>()
        };
        let expires_at = Utc::now() + chrono::Duration::try_minutes(5).unwrap();

        sqlx::query!("INSERT INTO otps (user_id, code, expires_at) VALUES ($1, $2, $3)", user.id, otp_code, expires_at)
            .execute(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        let user_email = user.email.clone();
        let otp_clone = otp_code.clone();
        let pool_clone = pool.clone();
        tokio::spawn(async move {
            let _ = crate::utils::email::send_otp_email(&pool_clone, &user_email, &otp_clone).await;
        });

        let token = create_token(user.id, role_str, false)?;
        let cookie = crate::utils::cookie::build_auth_cookie(token);
        let csrf_token = uuid::Uuid::new_v4().to_string();
        let csrf_cookie = crate::utils::cookie::build_csrf_cookie(csrf_token);

        return Ok((jar.add(cookie).add(csrf_cookie), Redirect::to(&format!("{}/auth/verify-2fa", frontend_url)).into_response()));
    }

    let token = create_token(user.id, role_str, true)?;
    let cookie = crate::utils::cookie::build_auth_cookie(token);
    let csrf_token = uuid::Uuid::new_v4().to_string();
    let csrf_cookie = crate::utils::cookie::build_csrf_cookie(csrf_token);

    let has_plan = jar.get("next-plan").is_some();
    let target_path = if has_plan { "/app/projects/create" } else { "/app/dashboard" };
    Ok((jar.add(cookie).add(csrf_cookie), Redirect::to(&format!("{}{}", frontend_url, target_path)).into_response()))
}
