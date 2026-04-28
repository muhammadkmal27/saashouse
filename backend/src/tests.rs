use axum::{
    body::Body,
    http::{Request, StatusCode, Method},
    middleware,
    routing::post,
    Router,
};
use tower::ServiceExt; // for `oneshot`
use axum_extra::extract::cookie::Cookie;
use crate::{AppState, router::create_router};
use std::sync::Arc;
use crate::utils::realtime::RealtimeHub;

#[tokio::test]
async fn test_csrf_protection_fails_without_header() {
    // Setup a mock state (doesn't need real DB for this middleware test)
    let pool = sqlx::PgPool::connect("postgres://root:rootpassword@localhost:5432/saashouse").await.unwrap();
    let redis = redis::Client::open("redis://127.0.0.1/").unwrap();
    let hub = Arc::new(RealtimeHub::new());
    let state = AppState { pool, redis, hub };

    let app = create_router(state);

    // Call a POST endpoint that requires CSRF (like auto-renew)
    // We provide the cookie but NOT the header. It should fail.
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/billing/projects/00000000-0000-0000-0000-000000000000/auto-renew")
                .header("Cookie", "csrf_token=test_token")
                .header("Content-Type", "application/json")
                .body(Body::from(r#"{"cancel_at_period_end": true}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn test_csrf_protection_succeeds_with_matching_tokens() {
    let pool = sqlx::PgPool::connect("postgres://root:rootpassword@localhost:5432/saashouse").await.unwrap();
    let redis = redis::Client::open("redis://127.0.0.1/").unwrap();
    let hub = Arc::new(RealtimeHub::new());
    let state = AppState { pool, redis, hub };

    let app = create_router(state);

    // Call with matching cookie and header. 
    // It will still fail with 401 Unauthorized (because of require_auth), 
    // but NOT 403 Forbidden (CSRF failure).
    let response = app
        .oneshot(
            Request::builder()
                .method(Method::POST)
                .uri("/api/billing/projects/00000000-0000-0000-0000-000000000000/auto-renew")
                .header("Cookie", "csrf_token=test_token")
                .header("X-CSRF-Token", "test_token")
                .header("Content-Type", "application/json")
                .body(Body::from(r#"{"cancel_at_period_end": true}"#))
                .unwrap(),
        )
        .await
        .unwrap();

    // Should be UNAUTHORIZED (401) because we didn't provide a valid JWT, 
    // but the CSRF check passed (otherwise it would be 403 FORBIDDEN).
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn test_toyyibpay_process_payment_deposit() {
    let pool = sqlx::PgPool::connect("postgres://root:rootpassword@localhost:5432/saashouse").await.unwrap();
    
    // 1. Create a dummy project and billing
    let user_id = uuid::Uuid::new_v4();
    sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", user_id, format!("test_tp_dep_{}@example.com", user_id)).execute(&pool).await.unwrap();
    
    let project_id = uuid::Uuid::new_v4();
    sqlx::query!("INSERT INTO projects (id, client_id, title, status) VALUES ($1, $2, 'TP Deposit Test', 'REVIEW')", project_id, user_id).execute(&pool).await.unwrap();
    
    let billing_id = uuid::Uuid::new_v4();
    sqlx::query!("INSERT INTO billings (id, project_id, amount, status, description) VALUES ($1, $2, 200.0, 'PENDING', 'DEPOSIT payment for project: TP Deposit Test')", billing_id, project_id).execute(&pool).await.unwrap();

    // 2. Mock callback
    let callback = crate::handlers::toyyibpay::ToyyibpayCallback {
        status_id: "1".into(),
        billcode: "test_code_dep".into(),
        order_id: billing_id.to_string(),
        msg: "Success".into(),
        transaction_id: "T123DEP".into(),
        amount: "200".into(),
    };

    // 3. Process
    crate::handlers::toyyibpay::process_payment(&pool, callback).await;

    // 4. Verify
    let project = sqlx::query!("SELECT status::TEXT FROM projects WHERE id = $1", project_id).fetch_one(&pool).await.unwrap();
    assert_eq!(project.status.unwrap(), "PAID");
    
    let billing = sqlx::query!("SELECT status::TEXT FROM billings WHERE id = $1", billing_id).fetch_one(&pool).await.unwrap();
    assert_eq!(billing.status.unwrap(), "PAID");
}

#[tokio::test]
async fn test_toyyibpay_process_payment_final() {
    let pool = sqlx::PgPool::connect("postgres://root:rootpassword@localhost:5432/saashouse").await.unwrap();
    
    // 1. Create a dummy project and billing (Status starts at PAID after deposit)
    let user_id = uuid::Uuid::new_v4();
    sqlx::query!("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'hash')", user_id, format!("test_tp_fin_{}@example.com", user_id)).execute(&pool).await.unwrap();
    
    let project_id = uuid::Uuid::new_v4();
    sqlx::query!("INSERT INTO projects (id, client_id, title, status) VALUES ($1, $2, 'TP Final Test', 'PAID')", project_id, user_id).execute(&pool).await.unwrap();
    
    let billing_id = uuid::Uuid::new_v4();
    sqlx::query!("INSERT INTO billings (id, project_id, amount, status, description) VALUES ($1, $2, 500.0, 'PENDING', 'FINAL payment for project: TP Final Test')", billing_id, project_id).execute(&pool).await.unwrap();

    // 2. Mock callback
    let callback = crate::handlers::toyyibpay::ToyyibpayCallback {
        status_id: "1".into(),
        billcode: "test_code_fin".into(),
        order_id: billing_id.to_string(),
        msg: "Success".into(),
        transaction_id: "T123FIN".into(),
        amount: "500".into(),
    };

    // 3. Process
    crate::handlers::toyyibpay::process_payment(&pool, callback).await;

    // 4. Verify
    let project = sqlx::query!("SELECT status::TEXT FROM projects WHERE id = $1", project_id).fetch_one(&pool).await.unwrap();
    assert_eq!(project.status.unwrap(), "LIVE");
    
    let billing = sqlx::query!("SELECT status::TEXT FROM billings WHERE id = $1", billing_id).fetch_one(&pool).await.unwrap();
    assert_eq!(billing.status.unwrap(), "PAID");
}
