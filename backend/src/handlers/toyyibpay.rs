use axum::{
    extract::{State, Path, Query},
    response::{IntoResponse, Redirect},
    Json,
    Extension,
};
use serde::{Deserialize, Serialize};
use std::env;
use uuid::Uuid;
use crate::AppState;
use crate::utils::{error::ApiError, jwt::Claims};
use reqwest::header::CONTENT_TYPE;

#[derive(Debug, Deserialize)]
pub struct ToyyibpayCheckoutRequest {
    pub project_id: Uuid,
    pub payment_type: String, // "DEPOSIT" or "FINAL"
}

#[derive(Debug, Serialize)]
pub struct ToyyibpayCheckoutResponse {
    pub checkout_url: String,
}

#[derive(Debug, Deserialize)]
pub struct ToyyibpayCallback {
    pub status_id: String, // 1=Success, 2=Pending, 3=Fail
    pub billcode: String,
    pub order_id: String, // This will be our Billing ID
    pub msg: String,
    pub transaction_id: String,
    pub amount: String,
}

pub async fn create_toyyibpay_bill(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<ToyyibpayCheckoutRequest>,
) -> Result<Json<ToyyibpayCheckoutResponse>, ApiError> {
    let pool = &state.pool;
    
    // 1. Get Project and Pricing info
    let project = sqlx::query!(
        "SELECT title, client_id FROM projects WHERE id = $1 AND client_id = $2",
        payload.project_id, claims.sub
    )
    .fetch_one(pool).await.map_err(|_| ApiError::NotFound("Project not found".into()))?;

    let deposit_price = crate::handlers::settings::get_setting_value(pool, "otp_deposit_price").await
        .and_then(|v| v.as_str().map(|s| s.parse::<f64>().ok()).flatten().or_else(|| v.as_f64()))
        .unwrap_or(200.0);

    let final_price = crate::handlers::settings::get_setting_value(pool, "otp_final_price").await
        .and_then(|v| v.as_str().map(|s| s.parse::<f64>().ok()).flatten().or_else(|| v.as_f64()))
        .unwrap_or(500.0);

    let amount = if payload.payment_type.to_uppercase() == "DEPOSIT" {
        deposit_price
    } else {
        final_price
    };

    // 2. Create Billing entry in DB
    let billing_id = Uuid::new_v4();
    let description = format!("{} payment for project: {}", payload.payment_type.to_uppercase(), project.title);

    sqlx::query!(
        r#"
        INSERT INTO billings (id, project_id, amount, status, description)
        VALUES ($1, $2, $3, 'PENDING', $4)
        "#,
        billing_id,
        payload.project_id,
        amount as f64,
        description
    )
    .execute(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    // 3. Call ToyyibPay API
    let secret_key = env::var("TOYYIBPAY_SECRET_KEY").map_err(|_| ApiError::Internal("TOYYIBPAY_SECRET_KEY not set".into()))?;
    let category_code = env::var("TOYYIBPAY_CATEGORY_CODE").map_err(|_| ApiError::Internal("TOYYIBPAY_CATEGORY_CODE not set".into()))?;
    let frontend_url = env::var("FRONTEND_URL").unwrap_or("http://localhost:3000".to_string());
    let backend_url = env::var("BACKEND_URL").unwrap_or("http://localhost:8080".to_string());

    let user = sqlx::query!("SELECT email, full_name, phone_number FROM users u JOIN user_profiles p ON u.id = p.user_id WHERE u.id = $1", claims.sub)
        .fetch_one(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let client = reqwest::Client::new();
    let amount_str = (amount * 100.0).to_string();
    let return_url = format!("{}/app/payment/toyyibpay-return", frontend_url);
    let callback_url = format!("{}/api/billing/toyyibpay-callback", backend_url);
    let external_ref = billing_id.to_string();

    let params = [
        ("userSecretKey", secret_key.as_str()),
        ("categoryCode", category_code.as_str()),
        ("billName", "SaaS House Project Payment"),
        ("billDescription", description.as_str()),
        ("billPriceSetting", "0"),
        ("billPayorInfo", "1"),
        ("billAmount", amount_str.as_str()),
        ("billReturnUrl", return_url.as_str()),
        ("billCallbackUrl", callback_url.as_str()),
        ("billExternalReferenceNo", external_ref.as_str()),
        ("billTo", user.full_name.as_str()),
        ("billEmail", user.email.as_str()),
        ("billPhone", user.phone_number.as_deref().unwrap_or("60123456789")),
        ("billDisplayMerchant", "1"),
        ("billPaymentChannel", "0"),
    ];

    let res = client.post("https://dev.toyyibpay.com/index.php/api/createBill") // Use production URL for prod
        .form(&params)
        .send().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let data: serde_json::Value = res.json().await.map_err(|e| ApiError::Internal(e.to_string()))?;
    
    // Toyyibpay returns an array with billCode or error
    let bill_code = data[0]["BillCode"].as_str().ok_or_else(|| {
        ApiError::Internal(format!("ToyyibPay Error: {}", data))
    })?;

    // Update billings with bill_code
    sqlx::query!(
        "UPDATE billings SET stripe_payment_id = $1 WHERE id = $2",
        bill_code, billing_id
    )
    .execute(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let checkout_url = format!("https://dev.toyyibpay.com/{}", bill_code);

    Ok(Json(ToyyibpayCheckoutResponse { checkout_url }))
}

pub async fn toyyibpay_callback(
    State(state): State<AppState>,
    Query(payload): Query<ToyyibpayCallback>,
) -> impl IntoResponse {
    process_payment(&state.pool, payload).await
}

#[derive(Debug, Deserialize)]
pub struct VerifyPaymentRequest {
    pub billcode: String,
    pub order_id: String,
}

pub async fn verify_payment(
    State(state): State<AppState>,
    Query(payload): Query<VerifyPaymentRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
    println!("DEBUG: verify_payment called for bill {}", payload.billcode);
    let pool = &state.pool;
    let secret_key = env::var("TOYYIBPAY_SECRET_KEY").map_err(|_| ApiError::Internal("TOYYIBPAY_SECRET_KEY not set".into()))?;

    // 1. Verify with ToyyibPay API
    let client = reqwest::Client::new();
    let res = client.post("https://dev.toyyibpay.com/index.php/api/getBillTransactions")
        .form(&[
            ("userSecretKey", secret_key.as_str()),
            ("billCode", payload.billcode.as_str()),
        ])
        .send().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let transactions: serde_json::Value = res.json().await.map_err(|e| ApiError::Internal(e.to_string()))?;
    println!("DEBUG: ToyyibPay Transactions for bill {}: {:?}", payload.billcode, transactions);
    
    // Check if any transaction is successful (settlement status 1)
    let is_settled = if let Some(arr) = transactions.as_array() {
        arr.iter().any(|t| {
            let status = t["billpaymentStatus"].as_str().unwrap_or("");
            status == "1" || status == "Success"
        })
    } else {
        // If not an array, check if it's a single object (some versions of API)
        let status = transactions["billpaymentStatus"].as_str().unwrap_or("");
        status == "1" || status == "Success"
    };

    if is_settled {
        // 2. Process payment in our DB
        let mock_callback = ToyyibpayCallback {
            status_id: "1".into(),
            billcode: payload.billcode,
            order_id: payload.order_id,
            msg: "Verified".into(),
            transaction_id: "VERIFIED".into(),
            amount: "0".into(),
        };
        process_payment(pool, mock_callback).await;
        Ok(Json(serde_json::from_str("{\"status\":\"success\"}").unwrap()))
    } else {
        Err(ApiError::BadRequest("Payment not settled yet".into()))
    }
}

pub(crate) async fn process_payment(pool: &sqlx::PgPool, payload: ToyyibpayCallback) -> axum::http::StatusCode {
    // status_id: 1=Success, 2=Pending, 3=Fail
    if payload.status_id == "1" {
        if let Ok(billing_id) = Uuid::parse_str(&payload.order_id) {
            let bill = sqlx::query!(
                "SELECT project_id, amount, description FROM billings WHERE id = $1",
                billing_id
            ).fetch_one(pool).await;

            if let Ok(b) = bill {
                let mut tx = match pool.begin().await {
                    Ok(tx) => tx,
                    Err(_) => return axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                };

                // Update billing status
                if let Err(_) = sqlx::query!(
                    "UPDATE billings SET status = 'PAID', updated_at = NOW() WHERE id = $1",
                    billing_id
                ).execute(&mut *tx).await {
                    return axum::http::StatusCode::INTERNAL_SERVER_ERROR;
                }

                // Logic to update Project status based on payment type (Deposit vs Final)
                let is_deposit = b.description.to_uppercase().contains("DEPOSIT");
                let new_status = if is_deposit { "PAID" } else { "LIVE" };

                if let Err(_) = sqlx::query!(
                    "UPDATE projects SET status = $1::project_status, updated_at = NOW() WHERE id = $2",
                    new_status as &str, b.project_id
                ).execute(&mut *tx).await {
                    return axum::http::StatusCode::INTERNAL_SERVER_ERROR;
                }

                if let Err(_) = tx.commit().await {
                    return axum::http::StatusCode::INTERNAL_SERVER_ERROR;
                }
            }
        }
    }

    axum::http::StatusCode::OK
}
