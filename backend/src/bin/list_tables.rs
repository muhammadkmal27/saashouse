use sqlx::postgres::PgPoolOptions;
use dotenvy::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    let tables = sqlx::query!("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'")
        .fetch_all(&pool)
        .await?;

    println!("--- Public Tables ---");
    for table in tables {
        println!("{}", table.tablename.unwrap_or_default());
    }

    Ok(())
}
