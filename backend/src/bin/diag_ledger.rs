use sqlx::postgres::PgPoolOptions;
use dotenv::dotenv;
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
            u.id as id,
            COALESCE(p.full_name, u.email) as "full_name!",
            u.email as "email!",
            pr.id as "project_id?",
            pr.title as "project_title?",
            COALESCE(s.plan_name, pr.requirements->>'selected_plan') as "plan_name?",
            pr.status::TEXT as "project_status?",
            s.id as "subscription_id?",
            s.status as "subscription_status?"
        FROM users u
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN projects pr ON u.id = pr.client_id
        LEFT JOIN subscriptions s ON pr.id = s.project_id
        WHERE u.role::TEXT = 'CLIENT'
        ORDER BY u.id, pr.created_at DESC NULLS LAST
        "#
    )
    .fetch_all(&pool)
    .await?;

    println!("--- Diagnostic: Fixed Admin Query (Project-Centric) ---");
    println!("Total Rows: {}", rows.len());
    for row in rows {
        println!("User: {} | Project: {} | Plan: {}", 
            row.email, 
            row.project_title.as_deref().unwrap_or("NONE"),
            row.plan_name.as_deref().unwrap_or("NONE")
        );
    }

    Ok(())
}
