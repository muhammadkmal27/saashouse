use axum::{extract::{Query, State}, Json};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use tokio::net::TcpStream;
use tokio::io::{AsyncWriteExt, AsyncReadExt};
use crate::utils::error::ApiError;
use crate::utils::email::send_notification_email;
use crate::AppState;

#[derive(Deserialize, ToSchema)]
pub struct WhoisQuery {
    pub domain: String,
}

#[derive(Serialize, ToSchema)]
pub struct WhoisResponse {
    pub domain: String,
    pub available: bool,
    pub raw_response: Option<String>,
}

#[derive(Deserialize, ToSchema)]
pub struct ContactRequest {
    pub full_name: String,
    pub email: String,
    pub subject: String,
    pub message: String,
}

#[utoipa::path(
    get,
    path = "/api/tools/whois",
    params(
        ("domain" = String, Query, description = "Domain to check availability for")
    ),
    responses(
        (status = 200, description = "Whois result", body = WhoisResponse)
    ),
    security(
        ("cookieAuth" = [])
    )
)]
pub async fn check_whois(Query(params): Query<WhoisQuery>) -> Result<Json<WhoisResponse>, ApiError> {
    let domain = params.domain.trim().to_lowercase();
    
    if domain.is_empty() || !domain.contains('.') {
        return Err(ApiError::BadRequest("Invalid domain format".to_string()));
    }

    // Sambung ke pelayan WHOIS (IANA as root)
    let mut stream = TcpStream::connect("whois.iana.org:43").await
        .map_err(|e| ApiError::Internal(format!("Failed to connect to WHOIS Server: {}", e)))?;

    let query_str = format!("{}\r\n", domain);
    stream.write_all(query_str.as_bytes()).await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let mut response = String::new();
    stream.read_to_string(&mut response).await
        .map_err(|e| ApiError::Internal(e.to_string()))?;

    let available = parse_whois_availability(&response);

    Ok(Json(WhoisResponse {
        domain,
        available,
        raw_response: Some(response.chars().take(200).collect::<String>()), // Ambil sedikit log untuk diag
    }))
}

pub fn parse_whois_availability(response: &str) -> bool {
    let response_lc = response.to_lowercase();
    response_lc.contains("not found") 
        || response_lc.contains("no match") 
        || response_lc.contains("is free")
        // Khusus untuk .my
        || response_lc.contains("does not exist in database")
}

pub async fn submit_contact_form(
    State(state): State<AppState>,
    Json(payload): Json<ContactRequest>
) -> Result<Json<serde_json::Value>, ApiError> {
    println!("DEBUG: Received contact form submission from: {}", payload.email);
    // Validate
    if payload.full_name.is_empty() || payload.email.is_empty() || payload.message.is_empty() {
        return Err(ApiError::BadRequest("Please fill in all required fields".to_string()));
    }

    let admin_email = "akmallmuhammad27@gmail.com";
    let subject = format!("New Inquiry: {}", payload.subject);
    let body = format!(
        "New contact form submission\n\nName: {}\nEmail: {}\nSubject: {}\n\nMessage:\n{}",
        payload.full_name, payload.email, payload.subject, payload.message
    );

    send_notification_email(&state.pool, admin_email, &subject, &body).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Message sent successfully"
    })))
}
