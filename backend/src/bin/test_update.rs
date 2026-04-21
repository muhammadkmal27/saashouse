use sqlx::PgPool;
use std::env;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPool::connect(&database_url).await?;

    let project_id = Uuid::parse_str("e240978d-195c-4404-b835-c58cc92a773a")?;
    
    println!("--- Testing Link Update ---");
    let res = sqlx::query!(
        "UPDATE projects SET dev_url = $1, prod_url = $2, updated_at = NOW() WHERE id = $3",
        Some("https://test-staging.com"),
        Some("https://test-prod.com"),
        project_id
    )
    .execute(&pool)
    .await;

    match res {
        Ok(info) => println!("Success! Rows affected: {}", info.rows_affected()),
        Err(e) => println!("Error during update: {:?}", e),
    }

    Ok(())
}
