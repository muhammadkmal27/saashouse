use sqlx::PgPool;
use std::env;
use backend::models::user::UserRole;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await?;

    println!("Checking last 5 users...");
    // Fixed with type override for enum role
    let users = sqlx::query!(r#"SELECT id, email, role as "role: UserRole", created_at FROM users ORDER BY created_at DESC LIMIT 5"#)
        .fetch_all(&pool)
        .await?;

    for user in users {
        println!("User: {} ({:?}) - Created: {:?}", user.email, user.role, user.created_at);
    }

    Ok(())
}
