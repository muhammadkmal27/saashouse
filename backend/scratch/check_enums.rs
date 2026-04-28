use sqlx::postgres::PgPoolOptions;
use dotenvy::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    println!("Enum values for 'project_status':");
    let values: Vec<String> = sqlx::query_scalar(
        "SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'project_status' ORDER BY enumsortorder"
    )
    .fetch_all(&pool)
    .await?;

    for val in values {
        println!(" - {}", val);
    }

    Ok(())
}
