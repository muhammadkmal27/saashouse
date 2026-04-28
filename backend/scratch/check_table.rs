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

    let tables = vec!["users", "password_resets"];

    for table in tables {
        println!("\nColumns for table '{}':", table);
        let columns: Vec<(String, String)> = sqlx::query_as(
            "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1"
        )
        .bind(table)
        .fetch_all(&pool)
        .await?;

        for (name, dtype) in columns {
            println!(" - {}: {}", name, dtype);
        }
    }

    Ok(())
}
