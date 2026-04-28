use sqlx::postgres::PgPoolOptions;
use bigdecimal::ToPrimitive;

#[derive(sqlx::FromRow, Debug)]
pub struct ClientLedgerRow {
    pub id: uuid::Uuid,
    pub full_name: String,
    pub email: String,
    pub project_id: Option<uuid::Uuid>,
    pub project_title: Option<String>,
    pub plan_name: Option<String>,
    pub project_status: Option<String>,
    pub subscription_id: Option<uuid::Uuid>,
    pub subscription_status: Option<String>,
    pub amount: Option<f64>,
    pub payment_source: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect("postgres://root:rootpassword@localhost:5432/saashouse").await?;

    println!("--- Testing Ledger Query ---");
    let rows = sqlx::query_as::<_, ClientLedgerRow>(
        r#"
        SELECT * FROM (
            SELECT
                u.id as id,
                COALESCE(p.full_name, u.email) as full_name,
                u.email as email,
                pr.id as project_id,
                pr.title as project_title,
                s.plan_name as plan_name,
                pr.status::TEXT as project_status,
                s.id as subscription_id,
                LOWER(s.status) as subscription_status,
                (CASE 
                    WHEN s.plan_name ILIKE '%PLATINUM%' THEN 400.00
                    WHEN s.plan_name ILIKE '%ENTERPRISE%' THEN 260.00
                    WHEN s.plan_name ILIKE '%GROWTH%' THEN 190.00
                    ELSE 165.00
                END)::FLOAT8 as amount,
                'Stripe' as payment_source,
                'Monthly Subscription' as description,
                s.created_at as created_at
            FROM subscriptions s
            JOIN users u ON s.client_id = u.id
            LEFT JOIN user_profiles p ON u.id = p.user_id
            LEFT JOIN projects pr ON s.project_id = pr.id
            WHERE s.status::TEXT = 'active'

            UNION ALL

            SELECT
                u.id as id,
                COALESCE(profiles.full_name, u.email) as full_name,
                u.email as email,
                pr.id as project_id,
                pr.title as project_title,
                NULL::TEXT as plan_name,
                pr.status::TEXT as project_status,
                NULL::UUID as subscription_id,
                NULL::TEXT as subscription_status,
                b.amount::FLOAT8 as amount,
                (CASE WHEN b.stripe_payment_id LIKE 'bill%' THEN 'ToyyibPay' ELSE 'Stripe' END) as payment_source,
                b.description as description,
                b.created_at as created_at
            FROM billings b
            JOIN projects pr ON b.project_id = pr.id
            JOIN users u ON pr.client_id = u.id
            LEFT JOIN user_profiles profiles ON u.id = profiles.user_id
            WHERE b.status::TEXT = 'PAID'
        ) combined
        ORDER BY created_at DESC
        "#
    )
    .fetch_all(&pool)
    .await?;

    println!("Ledger Rows found: {}", rows.len());
    for row in rows {
        println!("{:?}", row);
    }

    println!("\n--- Testing Stats Query ---");
    let days = 0;
    let projects_count = sqlx::query!(
        r#"SELECT COUNT(*)::BIGINT as "count!" FROM projects WHERE status::TEXT IN ('PAID', 'UNDER_DEVELOPMENT', 'LIVE') AND ($1 = 0 OR created_at >= NOW() - (CAST($1 AS TEXT) || ' days')::INTERVAL)"#,
        days
    ).fetch_one(&pool).await?;
    println!("Active Projects Count: {}", projects_count.count);

    let revenue = sqlx::query!(
        r#"SELECT COALESCE(SUM(amount), 0)::FLOAT8 as "sum!" FROM billings WHERE status::TEXT = 'PAID' AND ($1 = 0 OR created_at >= NOW() - (CAST($1 AS TEXT) || ' days')::INTERVAL)"#,
        days
    ).fetch_one(&pool).await?;
    println!("Total Revenue: {}", revenue.sum);

    Ok(())
}
