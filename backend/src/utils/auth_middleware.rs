use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
};
use axum_extra::extract::CookieJar;
use crate::utils::{error::ApiError, jwt::verify_token};

pub async fn require_auth(
    jar: CookieJar,
    mut req: Request,
    next: Next,
) -> Result<Response, ApiError> {
    // 1. Skip auth for OPTIONS (CORS preflight)
    if req.method() == axum::http::Method::OPTIONS {
        return Ok(next.run(req).await);
    }

    let token = jar
        .get("auth_token")
        .map(|cookie| cookie.value().to_string())
        .ok_or(ApiError::Unauthorized)?;

    let claims = verify_token(&token)?;
    
    // Insert user claims into request extensions so handlers can access user_id
    req.extensions_mut().insert(claims);

    Ok(next.run(req).await)
}
