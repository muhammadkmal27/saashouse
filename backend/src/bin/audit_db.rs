use sqlx::PgPool;
use std::env;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv::dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPool::connect(&database_url).await?;

    println!("--- DB Audit ---");
    
    let users_count = sqlx::query!("SELECT COUNT(*) as count FROM users WHERE role = 'CLIENT'")
        .fetch_one(&pool).await?.count.unwrap_or(0);
    println!("Total Clients: {}", users_count);

    let profiles_count = sqlx::query!("SELECT COUNT(*) as count FROM user_profiles")
        .fetch_one(&pool).await?.count.unwrap_or(0);
    println!("Total Profiles: {}", profiles_count);

    // List users and their roles
    let users = sqlx::query!(
        r#"
        SELECT u.email, u.role::TEXT as role_text, p.full_name as "full_name?"
        FROM users u 
        LEFT JOIN user_profiles p ON u.id = p.user_id
        "#
    )
    .fetch_all(&pool)
    .await?;
    
    println!("\n--- Users, Roles & Names ---");
    for user in users {
        let email = user.email.unwrap_or_else(|| "N/A".to_string());
        let role = user.role_text.unwrap_or_else(|| "N/A".to_string());
        let name = user.full_name.unwrap_or_else(|| "No Name".to_string());
        
        println!("{}: {} [{}]", email, role, name);
    }

    // Debug: Projects columns
    let cols = sqlx::query!(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'projects'"
    )
    .fetch_all(&pool)
    .await?;
    
    println!("\n--- Projects Table Columns ---");
    for col in cols {
        println!("Column: {}", col.column_name.unwrap_or_default());
    }

    let projects_count = sqlx::query!("SELECT COUNT(*) as count FROM projects")
        .fetch_one(&pool)
        .await?;
    println!("\nTotal Projects: {}", projects_count.count.unwrap_or(0));

    let orphan_users = sqlx::query!(
        "SELECT u.email FROM users u LEFT JOIN user_profiles p ON u.id = p.user_id WHERE u.role = 'CLIENT' AND p.user_id IS NULL"
    )
    .fetch_all(&pool).await?;
    
    if !orphan_users.is_empty() {
        println!("Orphan Clients (No Profile):");
        for u in orphan_users {
            println!(" - {}", u.email);
        }
    } else {
        println!("All clients have profiles.");
    }

    Ok(())
}
