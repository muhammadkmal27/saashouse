use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, AsyncSmtpTransport, AsyncTransport, Tokio1Executor};
use std::env;
use crate::utils::error::ApiError;
use sqlx::{Pool, Postgres};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SmtpConfig {
    pub host: String,
    pub port: u16,
    pub user: String,
    pub from: String,
    pub password: Option<String>,
}

async fn get_smtp_config(_pool: Option<&Pool<Postgres>>) -> SmtpConfig {
    // ALWAYS use ENV for SMTP as per user request to decentralize from DB Admin
    SmtpConfig {
        host: env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.gmail.com".to_string()),
        port: env::var("SMTP_PORT").unwrap_or_else(|_| "465".to_string()).parse::<u16>().unwrap_or(465),
        user: env::var("SMTP_USER").unwrap_or_else(|_| "".to_string()),
        from: env::var("SMTP_FROM").unwrap_or_else(|_| "no-reply@saashouse.com".to_string()),
        password: env::var("SMTP_PASS").ok(),
    }
}

pub async fn send_otp_email(pool: &Pool<Postgres>, to_email: &str, otp_code: &str) -> Result<(), ApiError> {
    let config = get_smtp_config(Some(pool)).await;
    
    let password = config.password.as_ref().filter(|p| !p.is_empty())
        .ok_or_else(|| ApiError::Internal("SMTP password not configured".to_string()))?;

    if config.user.is_empty() {
        return Err(ApiError::Internal("SMTP user not configured".to_string()));
    }

    let email = Message::builder()
        .from(format!("SaaS House <{}>", config.from).parse().unwrap())
        .to(to_email.parse().map_err(|_| ApiError::Internal("Invalid recipient email".to_string()))?)
        .subject("Admin Login - 2FA Verification Code")
        .body(format!(
            "SaaS House Security\n\nYour 2FA verification code is: {}\n\nThis code will expire in 5 minutes. If you did not request this code, please change your password immediately.",
            otp_code
        ))
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let creds = Credentials::new(config.user.clone(), password.clone());
    let protocol = if config.port == 465 { "smtps" } else { "smtp" };
    let mailer_url = format!("{}://{}", protocol, config.host);

    let mailer: AsyncSmtpTransport<Tokio1Executor> = AsyncSmtpTransport::<Tokio1Executor>::from_url(&mailer_url)
        .map_err(|e| ApiError::Internal(format!("Invalid SMTP URL: {}", e)))?
        .port(config.port)
        .credentials(creds)
        .build();

    mailer.send(email).await
        .map_err(|e| ApiError::Internal(format!("Failed to send OTP email: {}", e)))?;

    Ok(())
}

pub async fn send_notification_email(pool: &Pool<Postgres>, to_email: &str, subject: &str, body: &str) -> Result<(), ApiError> {
    let config = get_smtp_config(Some(pool)).await;

    let password = config.password.as_ref().filter(|p| !p.is_empty())
        .ok_or_else(|| ApiError::Internal("SMTP password not configured".to_string()))?;

    if config.user.is_empty() {
        return Err(ApiError::Internal("SMTP user not configured".to_string()));
    }

    let email = Message::builder()
        .from(format!("SaaS House <{}>", config.from).parse().unwrap())
        .to(to_email.parse().map_err(|_| ApiError::Internal("Invalid recipient email".to_string()))?)
        .subject(subject)
        .body(body.to_string())
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let creds = Credentials::new(config.user.clone(), password.clone());
    let protocol = if config.port == 465 { "smtps" } else { "smtp" };
    let mailer_url = format!("{}://{}", protocol, config.host);

    let mailer: AsyncSmtpTransport<Tokio1Executor> = AsyncSmtpTransport::<Tokio1Executor>::from_url(&mailer_url)
        .map_err(|e| ApiError::Internal(format!("Invalid SMTP URL: {}", e)))?
        .port(config.port)
        .credentials(creds)
        .build();

    mailer.send(email).await
        .map_err(|e| ApiError::Internal(format!("Failed to send notification email: {}", e)))?;

    Ok(())
}
