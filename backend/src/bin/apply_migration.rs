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

    println!("Applying enum update migration...");

    // PostgreSQL ALTER TYPE ADD VALUE cannot be run in a transaction block
    // sqlx execute runs it as a single command.
    
    // Check if PAID already exists
    let exists = sqlx::query!(
        r#"SELECT 1 as "exists!" FROM pg_enum WHERE enumtypid = 'project_status'::regtype AND enumlabel = 'PAID'"#
    ).fetch_optional(&pool).await?;

    if exists.is_none() {
        sqlx::query("ALTER TYPE project_status ADD VALUE 'PAID' AFTER 'PAYMENT_PENDING'").execute(&pool).await?;
        println!("Added PAID status.");
    } else {
        println!("PAID status already exists.");
    }

    // Check if UNDER_DEVELOPMENT already exists
    let exists = sqlx::query!(
        r#"SELECT 1 as "exists!" FROM pg_enum WHERE enumtypid = 'project_status'::regtype AND enumlabel = 'UNDER_DEVELOPMENT'"#
    ).fetch_optional(&pool).await?;

    if exists.is_none() {
        sqlx::query("ALTER TYPE project_status ADD VALUE 'UNDER_DEVELOPMENT' AFTER 'PAID'").execute(&pool).await?;
        println!("Added UNDER_DEVELOPMENT status.");
    } else {
        println!("UNDER_DEVELOPMENT status already exists.");
    }

    println!("SUCCESS: Migration applied.");

    Ok(())
}
