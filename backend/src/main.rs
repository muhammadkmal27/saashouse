use backend::AppState;
use backend::router;
use backend::utils::realtime::RealtimeHub;
use axum::Router;
use sqlx::postgres::PgPoolOptions;
use std::env;
use std::sync::Arc;


#[tokio::main]
async fn main() {
    dotenv::dotenv().ok();
    
    // Connect to PostgreSQL
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to Postgres!");

    // Initialize Realtime Hub
    let hub = Arc::new(RealtimeHub::new());
    
    let state = AppState {
        pool: pool.clone(),
        hub,
    };

    // Build our application with router
    let app = router::create_router(state);

    // Run our app with hyper, listening globally on port 8080
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("API listening on http://127.0.0.1:8080");
    println!("Swagger UI available at http://127.0.0.1:8080/swagger-ui");
    axum::serve(listener, app).await.unwrap();
}
