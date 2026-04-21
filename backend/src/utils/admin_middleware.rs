use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
};
use crate::utils::{error::ApiError, jwt::Claims};

pub async fn require_admin(
    req: Request,
    next: Next,
) -> Result<Response, ApiError> {
    // 1. Skip admin check for OPTIONS (CORS preflight)
    if req.method() == axum::http::Method::OPTIONS {
        return Ok(next.run(req).await);
    }

    let claims = req.extensions().get::<Claims>()
        .ok_or(ApiError::Unauthorized)?;

    if claims.role != "ADMIN" {
        eprintln!("ADMIN_MIDDLEWARE: Access denied. User {} has role {}", claims.sub, claims.role);
        return Err(ApiError::Forbidden("Admin access required".to_string()));
    }

    if !claims.is_2fa_verified {
        eprintln!("ADMIN_MIDDLEWARE: Access denied. User {} has not verified 2FA", claims.sub);
        return Err(ApiError::Forbidden("2FA pengesahan diperlukan untuk akses Pentadbir".to_string()));
    }

    Ok(next.run(req).await)
}
