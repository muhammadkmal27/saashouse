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

    println!("Checking project_status enum values...");

    let rows = sqlx::query!(
        "SELECT enumlabel FROM pg_enum WHERE enumtypid = 'project_status'::regtype ORDER BY enumsortorder"
    ).fetch_all(&pool).await?;

    for row in rows {
        println!("Enum Value: {:?}", row.enumlabel);
    }

    Ok(())
}
