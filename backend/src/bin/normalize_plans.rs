use sqlx::postgres::PgPoolOptions;
use std::env;
use dotenv::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url).await?;

    println!("Starting Plan Name Normalization...");

    let mut tx = pool.begin().await?;

    // 1. Update subscriptions table
    let sub_rows = sqlx::query!(
        "UPDATE subscriptions SET plan_name = 'Standard' WHERE plan_name ILIKE '%Professional%' OR plan_name ILIKE '%Monthly Pro%'"
    ).execute(&mut *tx).await?;
    println!("Updated {} rows in subscriptions table.", sub_rows.rows_affected());

    // 2. Update projects requirements JSON (selected_plan field)
    // We target the JSONB field to normalize old names
    let proj_rows = sqlx::query!(
        r#"
        UPDATE projects 
        SET requirements = requirements || '{"selected_plan": "Standard"}'::jsonb
        WHERE requirements->>'selected_plan' ILIKE '%Professional%' 
           OR requirements->>'selected_plan' ILIKE '%Monthly Pro%'
           OR requirements->>'selected_plan' IS NULL
        "#
    ).execute(&mut *tx).await?;
    println!("Updated {} rows in projects table requirements.", proj_rows.rows_affected());

    tx.commit().await?;

    println!("SUCCESS: Plan names normalized to the 4 official packages.");

    Ok(())
}
