use sqlx::postgres::PgPoolOptions;
use dotenvy::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    
    println!("Connecting to database...");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("Resetting main business tables...");
    
    // 1. Truncate all project-related and billing tables
    // CASCADE will handle foreign key constraints
    sqlx::query("TRUNCATE TABLE 
        projects, 
        service_agreements, 
        billings, 
        subscriptions, 
        requests, 
        request_comments, 
        assets, 
        notifications 
        RESTART IDENTITY CASCADE;")
        .execute(&pool)
        .await?;

    // 2. Delete Clients (Users with role CLIENT)
    // Clean up preferences and profiles first to avoid orphans
    sqlx::query("DELETE FROM user_profiles WHERE user_id IN (SELECT id FROM users WHERE role = 'CLIENT');")
        .execute(&pool)
        .await?;
        
    sqlx::query("DELETE FROM user_preferences WHERE user_id IN (SELECT id FROM users WHERE role = 'CLIENT');")
        .execute(&pool)
        .await?;

    // Finally delete the client users themselves
    sqlx::query("DELETE FROM users WHERE role = 'CLIENT';")
        .execute(&pool)
        .await?;

    println!("✅ Database reset successful! (Admin preserved)");
    Ok(())
}
