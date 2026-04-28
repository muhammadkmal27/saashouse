use sqlx::PgPool;
use std::env;
use dotenvy::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPool::connect(&database_url).await?;

    let settings = sqlx::query!("SELECT key, value FROM system_settings")
        .fetch_all(&pool)
        .await?;

    println!("--- System Settings ---");
    for s in settings {
        println!("{}: {}", s.key, s.value);
    }

    Ok(())
}
