use sqlx::postgres::PgPoolOptions;
use dotenv::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    let email = "akmallmuhammad27@gmail.com";
    
    // Using a different query style to avoid type inference issues in scratch
    let row: Option<(String, String)> = sqlx::query_as("SELECT email, role::text FROM users WHERE email = $1")
        .bind(email)
        .fetch_optional(&pool)
        .await?;

    match row {
        Some((e, r)) => println!("User found: Email={}, Role={}", e, r),
        None => println!("User not found in database."),
    }

    Ok(())
}
