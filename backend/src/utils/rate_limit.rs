use axum::{
    extract::{State, Request},
    middleware::Next,
    response::{IntoResponse, Response},
    http::StatusCode,
};
use crate::AppState;
use redis::AsyncCommands;
use std::time::{SystemTime, UNIX_EPOCH};

pub async fn rate_limit_middleware(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Response {
    // Skip rate limiting in tests
    if cfg!(test) {
        return next.run(req).await;
    }

    // 1. Extract IP
    let ip = req.headers()
        .get("x-forwarded-for")
        .and_then(|h| h.to_str().ok())
        .and_then(|s| s.split(',').next())
        .map(|s| s.trim().to_string())
        .unwrap_or_else(|| {
            req.extensions()
                .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
                .map(|info| info.0.ip().to_string())
                .unwrap_or_else(|| "unknown".into())
        });

    let path = req.uri().path();
    
    // 2. Define Limits (Rule 21)
    // Global: 50 requests per 30 seconds
    // Auth paths: 5 requests per 1 minute
    let (limit, window_secs) = if path.starts_with("/api/auth") || path == "/api/contact" {
        (5, 60)
    } else {
        (50, 30)
    };

    let key = format!("rl:{}:{}", ip, if path.starts_with("/api/auth") { "auth" } else { "global" });

    // 3. Redis Sliding Window (Atomic)
    let mut conn = match state.redis.get_async_connection().await {
        Ok(c) => c,
        Err(_) => return next.run(req).await, // Fail open if Redis is down
    };

    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    let window_start = now - window_secs;

    let result: Result<(i64, i64, i64, i64), _> = redis::pipe()
        .atomic()
        .zrembyscore(&key, 0, window_start)
        .zadd(&key, now, now)
        .zcard(&key)
        .expire(&key, window_secs as i64)
        .query_async(&mut conn)
        .await;

    match result {
        Ok((_, _, count, _)) => {
            if count > limit {
                println!("RATE_LIMIT: Blocked IP {} for path {}", ip, path);
                return (StatusCode::TOO_MANY_REQUESTS, "Terlalu banyak permintaan. Sila cuba sebentar lagi.").into_response();
            }
        }
        Err(e) => {
            eprintln!("REDIS_ERROR: Rate limit failed: {}", e);
        }
    }

    next.run(req).await
}
