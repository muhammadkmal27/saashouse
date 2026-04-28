use axum_extra::extract::cookie::{Cookie, SameSite};
use std::env;

pub fn build_auth_cookie<'a>(token: String) -> Cookie<'a> {
    let is_prod = env::var("APP_ENV").unwrap_or_default() == "production";
    
    Cookie::build(("auth_token", token))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .secure(is_prod) // Only send over HTTPS in production (Rule 20)
        .build()
}

pub fn build_logout_cookie<'a>() -> Vec<Cookie<'a>> {
    let c1 = Cookie::build(("auth_token", ""))
        .path("/")
        .http_only(true)
        .same_site(SameSite::Lax)
        .secure(false)
        .max_age(time::Duration::seconds(0))
        .build();
        
    let c2 = Cookie::build(("csrf_token", ""))
        .path("/")
        .http_only(false)
        .same_site(SameSite::Lax)
        .secure(false)
        .max_age(time::Duration::seconds(0))
        .build();
        
    vec![c1, c2]
}

pub fn build_csrf_cookie<'a>(token: String) -> Cookie<'a> {
    let is_prod = env::var("APP_ENV").unwrap_or_default() == "production";
    Cookie::build(("csrf_token", token))
        .path("/")
        .http_only(false) // Allow JS to read for CSRF protection (Double Submit)
        .same_site(SameSite::Lax)
        .secure(is_prod)
        .build()
}
