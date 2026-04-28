use axum::{
    body::Body,
    http::{Request, StatusCode, Method},
    middleware::Next,
    response::{IntoResponse, Response},
    extract::State,
};
use axum_extra::extract::cookie::CookieJar;
use crate::AppState;
use crate::utils::security_logger::{log_security_event, SecurityEvent};

pub async fn csrf_middleware(
    State(state): State<AppState>,
    jar: CookieJar,
    req: axum::extract::Request,
    next: Next,
) -> Response {
    let method = req.method();

    // 1. Skip GET, HEAD, OPTIONS (Rule 19)
    if method == Method::GET || method == Method::HEAD || method == Method::OPTIONS {
        return next.run(req).await;
    }

    // 2. Extract CSRF Token from Cookie
    let cookie_token = match jar.get("csrf_token")
        .map(|c| c.value().to_string()) {
            Some(t) => t,
            None => return StatusCode::FORBIDDEN.into_response(),
        };

    // 3. Extract CSRF Token from Header
    let header_token = match req.headers()
        .get("X-CSRF-Token")
        .and_then(|h| h.to_str().ok()) {
            Some(t) => t,
            None => return StatusCode::FORBIDDEN.into_response(),
        };

    // 4. Compare (Double Submit Cookie Pattern)
    if cookie_token != header_token {
        let path = req.uri().path().to_string();
        let ip = req.headers().get("x-forwarded-for").and_then(|h| h.to_str().ok()).unwrap_or("unknown").to_string();
        
        log_security_event(&state.pool, SecurityEvent::CsrfFailure { path, ip }, None, None).await;
        
        println!("CSRF Validation Failed: Cookie and Header tokens mismatch");
        return StatusCode::FORBIDDEN.into_response();
    }

    next.run(req).await
}
