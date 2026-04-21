use sqlx::postgres::PgPoolOptions;
use std::env;
use dotenv::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("Cleaning database...");
    
    // Ordered by dependency
    sqlx::query("TRUNCATE TABLE request_comments CASCADE").execute(&pool).await?;
    sqlx::query("TRUNCATE TABLE requests CASCADE").execute(&pool).await?;
    sqlx::query("TRUNCATE TABLE billings CASCADE").execute(&pool).await?;
    sqlx::query("TRUNCATE TABLE subscriptions CASCADE").execute(&pool).await?;
    sqlx::query("TRUNCATE TABLE assets CASCADE").execute(&pool).await?;
    sqlx::query("TRUNCATE TABLE notifications CASCADE").execute(&pool).await?;
    sqlx::query("TRUNCATE TABLE projects CASCADE").execute(&pool).await?;

    println!("Database cleaned successfully.");
    Ok(())
}
