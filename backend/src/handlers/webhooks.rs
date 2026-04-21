use axum::{
    extract::State,
    body::Bytes,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse},
    Json,
};
use crate::AppState;
use serde_json::Value;
use crate::utils::error::ApiError;
use hmac::{Hmac, Mac, KeyInit};
use sha2::Sha256;
use hex;
use std::env;

type HmacSha256 = Hmac<Sha256>;

pub async fn handle_stripe_webhook(
    State(state): State<AppState>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<impl IntoResponse, ApiError> {
    let pool = &state.pool;
    let payload = String::from_utf8(body.to_vec())
        .map_err(|_| ApiError::BadRequest("Invalid UTF-8 payload".to_string()))?;

    // 1. Verify Stripe Signature (Mandatory for security)
    let sig_header = headers.get("stripe-signature")
        .and_then(|h| h.to_str().ok())
        .ok_or(ApiError::Unauthorized)?;

    if let Err(e) = verify_stripe_signature(&payload, sig_header) {
        println!("Stripe Signature Verification Failed: {:?}", e);
        return Err(e);
    }

    // 2. Parse Event
    let event: Value = serde_json::from_str(&payload)
        .map_err(|_| ApiError::BadRequest("Invalid JSON".to_string()))?;

    let event_id = event["id"].as_str().unwrap_or("");
    let event_type = event["type"].as_str().unwrap_or("");

    // 3. Idempotency Check (Rule 11)
    let already_processed = sqlx::query!(
        "SELECT event_id FROM processed_webhooks WHERE event_id = $1",
        event_id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    if already_processed.is_some() {
        println!("INFO: Duplicate Stripe Event {} already processed. Skipping.", event_id);
        return Ok(axum::http::StatusCode::OK);
    }

    match event_type {
        "checkout.session.completed" => {
            let session = &event["data"]["object"];
            let project_id_str = session["metadata"]["project_id"].as_str().unwrap_or_default();
            let user_id_str = session["metadata"]["user_id"].as_str().unwrap_or_default();
            let sub_id = session["subscription"].as_str().unwrap_or_default();
            let plan_name = session["metadata"]["plan_name"].as_str().unwrap_or("Standard");

            if let (Ok(pid), Ok(uid)) = (uuid::Uuid::parse_str(project_id_str), uuid::Uuid::parse_str(user_id_str)) {
                let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

                // 1. Mark Project as PAID (Confirmed Payment)
                sqlx::query!("UPDATE projects SET status = 'PAID' WHERE id = $1", pid)
                    .execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

                // 2. Create/Update Subscription record
                sqlx::query!(
                    "INSERT INTO subscriptions (client_id, project_id, stripe_sub_id, plan_name, status, current_period_end) 
                     VALUES ($1, $2, $3, $4, 'active', NOW() + INTERVAL '1 month')
                     ON CONFLICT (stripe_sub_id) DO UPDATE SET status = 'active', current_period_end = EXCLUDED.current_period_end, plan_name = EXCLUDED.plan_name",
                    uid, pid, sub_id, plan_name
                ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

                // 3. Log Event for Idempotency
                sqlx::query!(
                    "INSERT INTO processed_webhooks (event_id, event_type) VALUES ($1, $2)",
                    event_id, event_type
                ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

                tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;
                println!("Project {} activated via checkout.session.completed for user {}", pid, uid);
            }
        },
        "invoice.paid" => {
            let data = &event["data"]["object"];
            let stripe_sub_id = data["subscription"].as_str().unwrap_or("");
            
            if let Some(lines) = data["lines"]["data"].as_array() {
                if let Some(first_line) = lines.get(0) {
                    if let Some(period_end) = first_line["period"]["end"].as_i64() {
                        let end_date = chrono::DateTime::from_timestamp(period_end, 0)
                            .unwrap_or_else(|| chrono::Utc::now());
                        
                        let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

                        sqlx::query!(
                            "UPDATE subscriptions SET status = 'active', current_period_end = $1, updated_at = NOW() WHERE stripe_sub_id = $2",
                            end_date,
                            stripe_sub_id
                        )
                        .execute(&mut *tx)
                        .await
                        .map_err(|e| ApiError::Internal(e.to_string()))?;

                        sqlx::query!(
                            "INSERT INTO processed_webhooks (event_id, event_type) VALUES ($1, $2)",
                            event_id, event_type
                        ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

                        tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;
                    }
                }
            }
        },
        "charge.refunded" => {
            let charge = &event["data"]["object"];
            let payment_intent = charge["payment_intent"].as_str().unwrap_or_default();
            let project_id_str = charge["metadata"]["project_id"].as_str()
                .or_else(|| charge["payment_intent_data"]["metadata"]["project_id"].as_str())
                .unwrap_or_default();

            if let Ok(pid) = uuid::Uuid::parse_str(project_id_str) {
                let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

                sqlx::query!("UPDATE projects SET status = 'PAYMENT_PENDING' WHERE id = $1", pid)
                    .execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;
                
                sqlx::query!("UPDATE subscriptions SET status = 'refunded' WHERE project_id = $1", pid)
                    .execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

                sqlx::query!(
                    "INSERT INTO processed_webhooks (event_id, event_type) VALUES ($1, $2)",
                    event_id, event_type
                ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

                tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;
                println!("Project {} set to PAYMENT_PENDING due to manual refund on PI {}", pid, payment_intent);
            }
        },
        "customer.subscription.deleted" | "customer.subscription.updated" => {
            let obj = &event["data"]["object"];
            let stripe_sub_id = obj["id"].as_str().unwrap_or("");
            let status = obj["status"].as_str().unwrap_or("canceled");
            
            let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

            sqlx::query!(
                "UPDATE subscriptions SET status = $1, updated_at = NOW() WHERE stripe_sub_id = $2",
                status,
                stripe_sub_id
            )
            .execute(&mut *tx)
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?;
            
            if status == "canceled" || status == "unpaid" {
                 sqlx::query!(
                    "UPDATE projects SET status = 'PAYMENT_PENDING' WHERE id = (SELECT project_id FROM subscriptions WHERE stripe_sub_id = $1)",
                    stripe_sub_id
                ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;
            }

            sqlx::query!(
                "INSERT INTO processed_webhooks (event_id, event_type) VALUES ($1, $2)",
                event_id, event_type
            ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

            tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;
        },
        "invoice.payment_failed" | "invoice.voided" | "invoice.deleted" => {
            let data = &event["data"]["object"];
            let stripe_sub_id = data["subscription"].as_str().unwrap_or("");
            
            let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

            sqlx::query!(
                "UPDATE projects SET status = 'PAYMENT_PENDING', updated_at = NOW() 
                 WHERE id = (SELECT project_id FROM subscriptions WHERE stripe_sub_id = $1)",
                stripe_sub_id
            )
            .execute(&mut *tx)
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?;
            
            sqlx::query!(
                "UPDATE subscriptions SET status = 'inactive' WHERE stripe_sub_id = $1",
                stripe_sub_id
            ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

            sqlx::query!(
                "INSERT INTO processed_webhooks (event_id, event_type) VALUES ($1, $2)",
                event_id, event_type
            ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

            tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;
            println!("ALERT: Invoice failed/voided for sub {}. Project status reset.", stripe_sub_id);
        },
        _ => {
            // Log unhandled but verify it and mark as processed to be safe
            sqlx::query!(
                "INSERT INTO processed_webhooks (event_id, event_type) VALUES ($1, $2)",
                event_id, event_type
            ).execute(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        }
    }

    Ok(axum::http::StatusCode::OK)
}

fn verify_stripe_signature(payload: &str, sig_header: &str) -> Result<(), ApiError> {
    let secret = env::var("STRIPE_WEBHOOK_SECRET").unwrap_or_default();
    if secret.is_empty() {
        return Ok(());
    }

    let parts: Vec<&str> = sig_header.split(',').collect();
    let mut timestamp = "";
    let mut signatures = Vec::new();

    for part in parts {
        let kv: Vec<&str> = part.split('=').collect();
        if kv.len() == 2 {
            if kv[0] == "t" { timestamp = kv[1]; }
            else if kv[0] == "v1" { signatures.push(kv[1]); }
        }
    }

    if timestamp.is_empty() || signatures.is_empty() {
        return Err(ApiError::Unauthorized);
    }

    let signed_payload = format!("{}.{}", timestamp, payload);
    
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|_| ApiError::Internal("HMAC init failed".to_string()))?;
    mac.update(signed_payload.as_bytes());
    
    let result = mac.finalize().into_bytes();
    let expected_sig = hex::encode(result);

    if signatures.iter().any(|&s| s == expected_sig) {
        Ok(())
    } else {
        Err(ApiError::Unauthorized)
    }
}
