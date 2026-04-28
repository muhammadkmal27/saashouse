use sqlx::PgPool;
use std::env;
use dotenvy::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await?;

    println!("--- AUDITING PROJECTS TABLE ---");
    
    // 1. Check columns
    let columns = sqlx::query!(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects'"
    )
    .fetch_all(&pool)
    .await?;

    for col in columns {
        println!(" - {}: {}", col.column_name.unwrap_or_default(), col.data_type.unwrap_or_default());
    }

    // 2. Check for NULL selected_plan
    let null_plans = sqlx::query!(
        "SELECT count(*) FROM projects WHERE selected_plan IS NULL OR selected_plan = ''"
    )
    .fetch_one(&pool)
    .await?;

    println!("\nProjects with NULL/Empty selected_plan: {}", null_plans.count.unwrap_or(0));

    // 3. Check for Custom Plan in JSONB vs column
    let discrepancies = sqlx::query!(
        "SELECT count(*) FROM projects 
         WHERE selected_plan = 'Custom Plan' 
         OR (requirements->>'selected_plan' IS NOT NULL AND selected_plan IS NULL)"
    )
    .fetch_one(&pool)
    .await?;

    println!("Projects with data discrepancies: {}", discrepancies.count.unwrap_or(0));

    Ok(())
}
