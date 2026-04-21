use sqlx::PgPool;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPool::connect(&database_url).await?;

    println!("--- Project URL Audit ---");
    let rows = sqlx::query!(
        r#"SELECT id, title, dev_url, prod_url, status::TEXT as status_text FROM projects"#
    )
    .fetch_all(&pool)
    .await?;

    for row in rows {
        println!(
            "ID: {} | Title: {} | Status: {} | Dev: {:?} | Prod: {:?}",
            row.id, 
            row.title, 
            row.status_text.unwrap_or_default(), 
            row.dev_url, 
            row.prod_url
        );
    }

    Ok(())
}
