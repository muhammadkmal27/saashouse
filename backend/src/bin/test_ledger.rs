use sqlx::postgres::PgPoolOptions;
use dotenvy::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    let rows = sqlx::query!(
        r#"
        SELECT 
            u.id as user_id,
            u.email,
            u.role::TEXT as role_text
        FROM users u
        WHERE u.role = 'CLIENT'
        "#
    )
    .fetch_all(&pool)
    .await?;

    println!("--- Testing Ledger Query ---");
    println!("Rows found: {}", rows.len());
    for row in rows {
        println!("User: {} ({}), Role: {}", row.email, row.user_id, row.role_text.unwrap_or_default());
    }

    Ok(())
}
