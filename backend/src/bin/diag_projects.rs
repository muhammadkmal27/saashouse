use sqlx::postgres::PgPoolOptions;
use dotenv::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    println!("--- Diagnostic: Projects & Subscriptions Audit ---");
    
    // Check all projects
    let projects = sqlx::query!(
        r#"SELECT id, client_id, title, status::TEXT as status, requirements FROM projects"#
    ).fetch_all(&pool).await?;

    println!("Total Projects: {}", projects.len());
    for p in projects {
        println!("Project: {:?} | Title: {} | Client: {:?} | Status: {:?} | Req: {:?}", 
            p.id, p.title, p.client_id, p.status, p.requirements);
    }

    // Check all subscriptions
    let subs = sqlx::query!(
        r#"SELECT id, client_id, plan_name, status, project_id FROM subscriptions"#
    ).fetch_all(&pool).await?;

    println!("\nTotal Subscriptions: {}", subs.len());
    for s in subs {
        println!("Sub: {:?} | Plan: {:?} | Client: {:?} | Project: {:?} | Status: {:?}", 
            s.id, s.plan_name, s.client_id, s.project_id, s.status);
    }

    // Check specific user: thekingakl.ma@gmail.com (id?)
    let user = sqlx::query!(
        r#"SELECT id, email FROM users WHERE email = 'thekingakl.ma@gmail.com'"#
    ).fetch_one(&pool).await?;
    
    println!("\nInvestigating user: {} ({})", user.email, user.id);
    
    // PATCH DATA for existing projects
    println!("PATCHING data for projects a.my and b.my...");
    sqlx::query!(
        r#"UPDATE projects SET requirements = requirements || '{"selected_plan": "Professional Plan"}' WHERE title IN ('Project: a.my', 'Project: b.my')"#
    ).execute(&pool).await?;
    
    println!("CLEARING auto-generated descriptions...");
    sqlx::query!(
        r#"UPDATE projects SET description = '' WHERE description LIKE 'Onboarding via%'"#
    ).execute(&pool).await?;
    
    println!("Patch completed successfully.");

    let user_projects = sqlx::query!(
        r#"SELECT id, title, requirements FROM projects WHERE client_id = $1"#,
        user.id
    ).fetch_all(&pool).await?;
    
    println!("Found {} projects for this user:", user_projects.len());
    for up in user_projects {
        println!(" - {}", up.title);
    }

    Ok(())
}
