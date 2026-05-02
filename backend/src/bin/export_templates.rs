use sqlx::postgres::PgPoolOptions;
use dotenvy::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new().connect(&database_url).await?;

    let rows = sqlx::query!("SELECT key, value FROM system_settings WHERE key LIKE 'agreement_template%'")
        .fetch_all(&pool)
        .await?;

    for row in rows {
        println!("--- KEY: {} ---", row.key);
        println!("{}", serde_json::to_string_pretty(&row.value)?);
    }

    Ok(())
}
