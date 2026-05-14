use axum::{extract::State, Json, response::{IntoResponse, Response}, http::HeaderMap};
use crate::AppState;
use crate::models::auth::{LoginRequest, RegisterRequest, AuthResponse, Verify2FARequest};
use crate::utils::error::ApiError;
use axum_extra::extract::cookie::CookieJar;

pub mod login;
pub mod registration;
pub mod registration_repo;
pub mod otp;
pub mod google;
pub mod password_reset;

#[cfg(test)]
mod registration_tests;
#[cfg(test)]
mod otp_tests;
#[cfg(test)]
mod google_tests;
#[cfg(test)]
mod password_reset_tests;

#[utoipa::path(
    post,
    path = "/api/auth/register",
    request_body = RegisterRequest,
    responses(
        (status = 200, description = "User registered and logged in", body = AuthResponse)
    )
)]
pub async fn register(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<RegisterRequest>
) -> Result<Response, ApiError> {
    let jar = CookieJar::from_headers(&headers);
    let ip = headers.get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or(s).trim().to_string());
    let ua = headers.get("user-agent").and_then(|h| h.to_str().ok()).map(|s| s.to_string());
    
    let repo = registration_repo::SqlxRegistrationRepo::new(state.pool.clone());
    let result = registration::register_logic(repo, jar, payload, ip, ua).await?;
    Ok(result.into_response())
}

#[utoipa::path(
    post,
    path = "/api/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "User logged in", body = AuthResponse)
    )
)]
pub async fn login(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<LoginRequest>
) -> Result<Response, ApiError> {
    let jar = CookieJar::from_headers(&headers);
    let ip = headers.get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.split(',').next().unwrap_or(s).trim().to_string());
    let ua = headers.get("user-agent").and_then(|h| h.to_str().ok()).map(|s| s.to_string());
    
    let result = login::login_logic(state.clone(), jar, payload, ip, ua).await?;
    Ok(result.into_response())
}

#[utoipa::path(
    post,
    path = "/api/auth/verify-2fa",
    request_body = Verify2FARequest,
    responses(
        (status = 200, description = "2FA Verified", body = AuthResponse)
    ),
    security(("cookieAuth" = []))
)]
pub async fn verify_2fa(
    State(state): State<AppState>,
    headers: HeaderMap,
    Json(payload): Json<Verify2FARequest>
) -> Result<Response, ApiError> {
    let jar = CookieJar::from_headers(&headers);
    let result = otp::verify_2fa_logic(state.clone(), jar, payload).await?;
    Ok(result.into_response())
}

#[utoipa::path(
    post,
    path = "/api/auth/logout",
    responses(
        (status = 200, description = "User logged out")
    ),
    security(("cookieAuth" = []))
)]
pub async fn logout() -> Response {
    use axum::http::header;
    use axum_extra::extract::cookie::Cookie;
    
    let cookie = Cookie::build(("auth_token", ""))
        .path("/")
        .http_only(true)
        .same_site(axum_extra::extract::cookie::SameSite::Lax)
        .secure(false)
        .max_age(time::Duration::seconds(0))
        .build();

    let mut response = Json(serde_json::json!({"message": "Logged out successfully"})).into_response();
    if let Ok(c) = header::HeaderValue::from_str(&cookie.to_string()) {
        response.headers_mut().insert(header::SET_COOKIE, c);
    }
    response
}

pub async fn resend_otp(
    State(state): State<AppState>,
    headers: HeaderMap,
) -> Result<Response, ApiError> {
    let jar = CookieJar::from_headers(&headers);
    let result = otp::resend_otp_logic(state.clone(), jar).await?;
    Ok(result.into_response())
}

#[derive(serde::Deserialize)]
struct TurnstileResponse {
    success: bool,
}

pub async fn verify_turnstile(token: &str) -> Result<(), ApiError> {
    let secret = std::env::var("TURNSTILE_SECRET_KEY")
        .unwrap_or_else(|_| "1x0000000000000000000000000000000AA".to_string());
    
    // In local dev without internet, or testing mode with the dummy secret, 
    // it will pass. The official dummy secret is 1x0000...
    let client = reqwest::Client::new();
    let res = client.post("https://challenges.cloudflare.com/turnstile/v0/siteverify")
        .form(&[
            ("secret", secret.as_str()),
            ("response", token),
        ])
        .send()
        .await
        .map_err(|e| {
            println!("⚠️ Turnstile API Error: {}", e);
            ApiError::Internal("Gagal menghubungi pelayan keselamatan Cloudflare.".to_string())
        })?;

    if res.status().is_success() {
        let ts_resp: TurnstileResponse = res.json().await.map_err(|_| {
            ApiError::Internal("Ralat menghurai jawapan Cloudflare.".to_string())
        })?;

        if ts_resp.success {
            Ok(())
        } else {
            Err(ApiError::BadRequest("Pengesahan Anti-Bot gagal. Sila cuba lagi.".to_string()))
        }
    } else {
        Err(ApiError::BadRequest("Pengesahan Anti-Bot tidak sah.".to_string()))
    }
}
