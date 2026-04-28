use sqlx::PgPool;
use std::env;
use dotenvy::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await?;

    println!("🚀 Starting Data Restoration & Cleanup for Project Plans...");

    let mut tx = pool.begin().await?;

    // 1. Recover plans from subscriptions table for projects that have them
    let recovered = sqlx::query!(
        r#"
        UPDATE projects p
        SET selected_plan = sub.plan_name
        FROM (
            SELECT DISTINCT ON (project_id) project_id, plan_name 
            FROM subscriptions 
            ORDER BY project_id, created_at DESC
        ) sub
        WHERE p.id = sub.project_id
        "#
    ).execute(&mut *tx).await?;
    println!("✅ Synchronized {} plans from subscriptions to projects column.", recovered.rows_affected());

    // 2. Salvage plans from JSONB for projects that DON'T have a subscription yet (Onboarding phase)
    let salvaged = sqlx::query!(
        r#"
        UPDATE projects
        SET selected_plan = requirements->>'selected_plan'
        WHERE selected_plan IS NULL 
          AND requirements->>'selected_plan' IS NOT NULL
        "#
    ).execute(&mut *tx).await?;
    println!("✅ Salvaged {} plans from legacy JSONB requirements.", salvaged.rows_affected());

    // 3. IMPORTANT: Purge 'selected_plan' key from JSONB requirements for ALL projects
    let purged = sqlx::query!(
        r#"
        UPDATE projects
        SET requirements = requirements - 'selected_plan'
        WHERE requirements ? 'selected_plan'
        "#
    ).execute(&mut *tx).await?;
    println!("✅ Purged legacy 'selected_plan' key from {} JSONB requirement records.", purged.rows_affected());

    // 4. Default remaining nulls to 'Standard' (Safety net)
    let defaulted = sqlx::query!(
        "UPDATE projects SET selected_plan = 'Standard' WHERE selected_plan IS NULL OR selected_plan = ''"
    ).execute(&mut *tx).await?;
    println!("✅ Defaulted {} empty project plans to 'Standard'.", defaulted.rows_affected());

    tx.commit().await?;

    println!("\n✨ Data Integrity Restored. 'selected_plan' is now the Single Source of Truth.");
    Ok(())
}
