use sqlx::postgres::PgPoolOptions;
use dotenv::dotenv;
use std::env;
use std::fs;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    println!("Attempting to run Fasa 12 migrations...");

    // Run the specific migration file
    let sql = fs::read_to_string("migrations/202604111200_subscription_ext.sql")?;
    
    for statement in sql.split(';') {
        let trimmed = statement.trim();
        if !trimmed.is_empty() {
            println!("Executing: {}...", trimmed.chars().take(50).collect::<String>());
            sqlx::query(trimmed).execute(&pool).await?;
        }
    }

    println!("✅ Fasa 12 migrations completed successfully.");

    Ok(())
}
