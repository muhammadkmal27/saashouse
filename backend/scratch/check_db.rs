use sqlx::postgres::PgPoolOptions;
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let database_url = std::env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new().connect(&database_url).await?;

    let rows = sqlx::query!("SELECT key, value FROM system_settings")
        .fetch_all(&pool)
        .await?;

    println!("--- SYSTEM SETTINGS IN DB ---");
    for row in rows {
        println!("{}: {}", row.key, row.value);
    }
    Ok(())
}
