use sqlx::PgPool;
use std::env;
use dotenvy::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await?;

    println!("Applying migration: 202604121100_user_preferences.sql");
    
    let migration_sql = std::fs::read_to_string("migrations/202604121100_user_preferences.sql")?;
    
    use sqlx::Executor;
    pool.execute(migration_sql.as_str()).await?;

    println!("Migration applied successfully!");
    Ok(())
}
