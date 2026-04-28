use sqlx::PgPool;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenvy::dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPool::connect(&database_url).await?;

    println!("--- DEEP CLEANUP START ---");
    
    // 1. Listings/Billings
    sqlx::query!("DELETE FROM billings").execute(&pool).await?;
    println!("Deleted Billings");

    // 2. Comments & Tickets
    sqlx::query!("DELETE FROM request_comments").execute(&pool).await?;
    sqlx::query!("DELETE FROM requests").execute(&pool).await?;
    println!("Deleted Requests & Comments");

    // 3. Assets
    sqlx::query!("DELETE FROM assets").execute(&pool).await?;
    println!("Deleted Assets");

    // 4. Subscriptions
    sqlx::query!("DELETE FROM subscriptions").execute(&pool).await?;
    println!("Deleted Subscriptions");

    // 5. Projects
    sqlx::query!("DELETE FROM projects").execute(&pool).await?;
    println!("Deleted Projects");

    println!("--- DEEP CLEANUP FINISHED ---");

    Ok(())
}
