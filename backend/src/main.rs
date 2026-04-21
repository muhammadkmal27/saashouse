use backend::AppState;
use backend::router;
use backend::utils::realtime::RealtimeHub;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::env;
use std::sync::Arc;
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2,
};


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

    // Run database migrations automatically
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run database migrations!");
    println!("✅ Database migrations applied successfully");

    // Seed admin account if it doesn't exist
    if let Err(e) = seed_admin(&pool).await {
        eprintln!("⚠️ Admin seed warning: {}", e);
    }

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

/// Seeds the default admin account if no admin user exists in the database.
/// Uses ON CONFLICT DO NOTHING to ensure idempotency — safe to run on every startup.
async fn seed_admin(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let admins = vec![
        ("akmallmuhammad27@gmail.com", "Admin SaaS 1"),
        ("mdsykr8894@gmail.com", "Admin SaaS 2"),
    ];
    let admin_password = "Admin123!";

    // Check if any admin already exists
    let existing_admin = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM users WHERE role = 'ADMIN'"
    )
    .fetch_one(pool)
    .await?;

    if existing_admin > 0 {
        println!("✅ Admin accounts already exist, skipping seed");
        return Ok(());
    }

    // Hash the password using Argon2
    let salt = SaltString::from_b64("c2FsdHNhbHRzYWx0")
        .map_err(|e| format!("Salt error: {}", e))?;
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(admin_password.as_bytes(), &salt)
        .map_err(|e| format!("Hash error: {}", e))?
        .to_string();

    for (email, name) in admins {
        let user_id = uuid::Uuid::new_v4();

        // Insert admin user
        sqlx::query(
            "INSERT INTO users (id, email, password_hash, role) 
             VALUES ($1, $2, $3, 'ADMIN') 
             ON CONFLICT (email) DO NOTHING"
        )
        .bind(user_id)
        .bind(email)
        .bind(&password_hash)
        .execute(pool)
        .await?;

        // Insert admin profile
        sqlx::query(
            "INSERT INTO user_profiles (user_id, full_name) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id) DO NOTHING"
        )
        .bind(user_id)
        .bind(name)
        .execute(pool)
        .await?;

        println!("✅ Admin account seeded: {}", email);
    }

    Ok(())
}
