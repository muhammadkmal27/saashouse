use serde::{Deserialize, Serialize};
use crate::AppState;
use crate::utils::email;
use redis::AsyncCommands;
use std::time::Duration;
use tokio::time::sleep;

#[derive(Debug, Serialize, Deserialize)]
pub enum Job {
    SendOtp {
        email: String,
        code: String,
    },
    SendPasswordReset {
        email: String,
        token: String,
    },
    SendNotification {
        email: String,
        subject: String,
        body: String,
    },
}

const QUEUE_NAME: &str = "saashouse:jobs";

/// Pushes a job to the Redis queue for asynchronous processing.
pub async fn push_job(redis_client: &redis::Client, job: Job) -> Result<(), String> {
    let mut conn = redis_client
        .get_async_connection()
        .await
        .map_err(|e| e.to_string())?;

    let payload = serde_json::to_string(&job).map_err(|e| e.to_string())?;
    
    let _: () = conn.lpush(QUEUE_NAME, payload).await.map_err(|e| e.to_string())?;
    
    Ok(())
}

/// Starts the background worker loop.
pub async fn start_worker(state: AppState) {
    println!("🚀 Redis Background Worker started");
    
    let mut conn = match state.redis.get_async_connection().await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("❌ Failed to start worker: Redis connection error: {}", e);
            return;
        }
    };

    loop {
        // BRPOP blocks until a job is available or timeout (5 seconds)
        let result: Result<Option<(String, String)>, _> = conn.brpop(QUEUE_NAME, 5.0).await;

        match result {
            Ok(Some((_, payload))) => {
                match serde_json::from_str::<Job>(&payload) {
                    Ok(job) => {
                        process_job(&state, job).await;
                    }
                    Err(e) => {
                        eprintln!("❌ Failed to parse job payload: {}", e);
                    }
                }
            }
            Ok(None) => {
                // Timeout reached, just loop again
                continue;
            }
            Err(e) => {
                eprintln!("❌ Redis Worker Error: {}. Retrying in 5s...", e);
                sleep(Duration::from_secs(5)).await;
                
                // Re-establish connection if needed
                if let Ok(c) = state.redis.get_async_connection().await {
                    conn = c;
                }
            }
        }
    }
}

async fn process_job(state: &AppState, job: Job) {
    match job {
        Job::SendOtp { email, code } => {
            println!("📧 Processing Job: Send OTP to {}", email);
            if let Err(e) = email::send_otp_email(&state.pool, &email, &code).await {
                eprintln!("❌ Failed to process SendOtp job: {:?}", e);
            }
        }
        Job::SendPasswordReset { email, token } => {
            println!("📧 Processing Job: Send Password Reset to {}", email);
            if let Err(e) = email::send_password_reset_email(&state.pool, &email, &token).await {
                eprintln!("❌ Failed to process SendPasswordReset job: {:?}", e);
            }
        }
        Job::SendNotification { email, subject, body } => {
            println!("📧 Processing Job: Send Notification to {}", email);
            if let Err(e) = email::send_notification_email(&state.pool, &email, &subject, &body).await {
                eprintln!("❌ Failed to process SendNotification job: {:?}", e);
            }
        }
    }
}
