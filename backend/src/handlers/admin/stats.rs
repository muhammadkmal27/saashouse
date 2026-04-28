use axum::{extract::{State, Query}, Json};
use crate::AppState;
use crate::models::admin::{AdminStats, StatsQuery};
use crate::utils::error::ApiError;
use bigdecimal::ToPrimitive;

#[utoipa::path(
    get,
    path = "/api/admin/stats",
    params(
        ("days" = i32, Query, description = "Number of days to look back for stats calculation")
    ),
    responses(
        (status = 200, description = "Admin Dashboard Stats", body = AdminStats)
    ),
    security(("cookieAuth" = []))
)]
pub async fn get_admin_stats(
    State(state): State<AppState>,
    Query(query): Query<StatsQuery>,
) -> Result<Json<AdminStats>, ApiError> {
    let pool = &state.pool;

    let days = query.days.unwrap_or(0); // 0 means ALL
    println!("DEBUG: Fetching admin stats with days filter: {}", days);

    // 1. Calculate MRR from active subscriptions
    let active_subs = sqlx::query!(
        r#"
        SELECT plan_name 
        FROM subscriptions 
        WHERE status = 'active' 
          AND ($1::INT = 0 OR created_at >= NOW() - (INTERVAL '1 day' * CAST($1 AS INTEGER)))
        "#,
        days
    )
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    // Fetch prices from settings
    let prices = crate::handlers::settings::get_setting_value(pool, "package_prices").await;
    let default_prices = serde_json::json!({
        "Standard": "165",
        "Growth": "240",
        "Enterprise": "410",
        "Platinum": "750"
    });
    let prices = prices.unwrap_or(default_prices);

    let mut total_mrr = 0.0;
    for sub in active_subs {
        let plan = sub.plan_name.clone().unwrap_or_default().to_lowercase();
        let price_val = if plan.contains("platinum") {
            prices.get("Platinum")
        } else if plan.contains("enterprise") {
            prices.get("Enterprise")
        } else if plan.contains("growth") {
            prices.get("Growth")
        } else {
            prices.get("Standard")
        };
        
        let price = price_val
            .and_then(|v| {
                if v.is_string() {
                    v.as_str().and_then(|s| s.parse::<f64>().ok())
                } else {
                    v.as_f64()
                }
            })
            .unwrap_or(165.0);
        
        total_mrr += price;
    }

    // 2. Count clients (Conditional Filter)
    let clients = sqlx::query!(
        r#"SELECT COUNT(*) as "count!" FROM users WHERE role::TEXT = 'CLIENT' AND ($1::INT = 0 OR created_at >= NOW() - (INTERVAL '1 day' * CAST($1 AS INTEGER)))"#, 
        days
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    // 3. Count ACTIVE projects (Status: PAID, UNDER_DEVELOPMENT, LIVE)
    let projects = sqlx::query!(
        r#"
        SELECT COUNT(*)::BIGINT as "count!" 
        FROM projects 
        WHERE status::TEXT IN ('PAID', 'UNDER_DEVELOPMENT', 'LIVE') 
          AND ($1 = 0 OR created_at >= NOW() - (CAST($1 AS TEXT) || ' days')::INTERVAL)
        "#,
        days
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    let revenue = sqlx::query!(
        r#"
        SELECT COALESCE(SUM(amount), 0)::FLOAT8 as "sum!" 
        FROM billings 
        WHERE status::TEXT = 'PAID' 
          AND ($1 = 0 OR created_at >= NOW() - (CAST($1 AS TEXT) || ' days')::INTERVAL)
        "#,
        days
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    let total_revenue = revenue.sum;

    Ok(Json(AdminStats {
        total_mrr,
        total_revenue: total_revenue + total_mrr,
        total_clients: clients.count,
        active_projects: projects.count,
    }))
}
