use sqlx::PgPool;
use std::env;
use dotenvy::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPool::connect(&database_url).await?;

    let agreements = sqlx::query!("SELECT project_name, total_cost, deposit_amount, balance_amount FROM service_agreements")
        .fetch_all(&pool)
        .await?;

    println!("--- Service Agreements ---");
    for a in agreements {
        println!("{}: Total={}, Deposit={}, Balance={}", 
            a.project_name, a.total_cost, a.deposit_amount, a.balance_amount);
    }

    Ok(())
}
