use axum::{extract::State, Json};
use crate::AppState;
use crate::models::admin::ClientLedgerRow;
use crate::models::project::ProjectStatus;
use crate::utils::error::ApiError;

#[utoipa::path(
    get,
    path = "/api/admin/clients",
    responses(
        (status = 200, description = "Client Ledger rows", body = [ClientLedgerRow])
    ),
    security(("cookieAuth" = []))
)]
pub async fn list_all_clients(
    State(state): State<AppState>,
) -> Result<Json<Vec<ClientLedgerRow>>, ApiError> {
    let pool = &state.pool;
    
    // Fetch prices from settings for dynamic calculation
    let prices_json = crate::handlers::settings::get_setting_value(pool, "package_prices").await;
    let default_prices = serde_json::json!({
        "Standard": "165",
        "Growth": "240",
        "Enterprise": "410",
        "Platinum": "750"
    });
    let prices = prices_json.unwrap_or(default_prices);

    let rows = sqlx::query_as::<_, ClientLedgerRow>(
        r#"
        SELECT 
            ROW_NUMBER() OVER(ORDER BY created_at DESC)::BIGINT as row_id,
            *
        FROM (
            SELECT
                s.id as id,
                COALESCE(p.full_name, u.email) as full_name,
                u.email as email,
                pr.id as project_id,
                pr.title as project_title,
                s.plan_name as plan_name,
                pr.status as project_status,
                s.id as subscription_id,
                LOWER(s.status) as subscription_status,
                0.0::FLOAT8 as amount,
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
                b.id as id,
                COALESCE(profiles.full_name, u.email) as full_name,
                u.email as email,
                pr.id as project_id,
                pr.title as project_title,
                NULL::TEXT as plan_name,
                pr.status as project_status,
                NULL::UUID as subscription_id,
                NULL::TEXT as subscription_status,
                b.amount::FLOAT8 as amount,
                (CASE 
                    WHEN b.stripe_payment_id LIKE 'pi_%' OR b.stripe_payment_id LIKE 'ch_%' THEN 'Stripe' 
                    ELSE 'ToyyibPay' 
                END) as payment_source,
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
    .fetch_all(pool)
    .await
    .map_err(|e: sqlx::Error| {
        ApiError::Internal(e.to_string())
    })?;

    let mut rows = rows;
    for row in rows.iter_mut() {
        // If it's a subscription and amount is 0, calculate based on dynamic prices
        if row.payment_source.as_deref() == Some("Stripe") && row.description.as_deref() == Some("Monthly Subscription") {
            let plan = row.plan_name.clone().unwrap_or_default().to_lowercase();
            let price_key = if plan.contains("platinum") {
                "Platinum"
            } else if plan.contains("enterprise") {
                "Enterprise"
            } else if plan.contains("growth") {
                "Growth"
            } else {
                "Standard"
            };

            let price = prices.get(price_key)
                .and_then(|v| {
                    if v.is_string() {
                        v.as_str().and_then(|s| s.parse::<f64>().ok())
                    } else {
                        v.as_f64()
                    }
                })
                .unwrap_or(165.0);
            
            row.amount = Some(price);
        }
    }

    Ok(Json(rows))
}
