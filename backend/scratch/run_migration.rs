use sqlx::postgres::PgPoolOptions;
use dotenv::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(&database_url)
        .await?;

    println!("Applying migration: service_agreement...");

    sqlx::query(r#"
    CREATE TABLE IF NOT EXISTS service_agreements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_name VARCHAR(255) NOT NULL,
        provider_name VARCHAR(255) NOT NULL,
        project_name VARCHAR(255) NOT NULL,
        total_cost DECIMAL(10, 2) NOT NULL,
        deposit_amount DECIMAL(10, 2) NOT NULL,
        balance_amount DECIMAL(10, 2) NOT NULL,
        signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        signature_data TEXT,
        UNIQUE(project_id)
    );
    "#).execute(&pool).await?;

    sqlx::query(r#"
    INSERT INTO system_settings (key, value, updated_at)
    VALUES ('service_provider_name', '"SaaS House Development"', NOW())
    ON CONFLICT (key) DO NOTHING;
    "#).execute(&pool).await?;

    println!("✅ Manual migration applied!");

    Ok(())
}
