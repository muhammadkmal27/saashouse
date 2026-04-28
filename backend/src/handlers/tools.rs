use axum::{extract::{Query, State}, Json};
use std::env;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use tokio::net::TcpStream;
use tokio::io::{AsyncWriteExt, AsyncReadExt};
use crate::utils::error::ApiError;
use crate::utils::email::send_notification_email;
use crate::AppState;
use redis::AsyncCommands;
use hickory_resolver::AsyncResolver;
use hickory_resolver::config::*;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct DomainAvailabilityResponse {
    pub domain: String,
    pub status: String,
    pub message: String,
}

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
    
    // Rule 18: Strict Whitelisting/Format for SSRF Prevention
    let domain_regex = regex::Regex::new(r"^[a-z0-9][a-z0-9-]{0,61}[a-z0-9](?:\.[a-z]{2,})+$").unwrap();
    if !domain_regex.is_match(&domain) {
        return Err(ApiError::BadRequest("Invalid domain format or malicious characters detected".to_string()));
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

#[utoipa::path(
    get,
    path = "/api/tools/domain-check",
    params(
        ("domain" = String, Query, description = "Domain to check availability for")
    ),
    responses(
        (status = 200, description = "Domain availability result", body = DomainAvailabilityResponse)
    ),
    security(("cookieAuth" = []))
)]
pub async fn check_domain_availability(
    State(_state): State<AppState>,
    Query(params): Query<WhoisQuery>,
) -> Result<Json<DomainAvailabilityResponse>, ApiError> {
    let domain = params.domain.trim().to_lowercase();
    
    // 1. Validation
    let domain_regex = regex::Regex::new(r"^[a-z0-9][a-z0-9-]{0,61}[a-z0-9](?:\.[a-z]{2,})+$").unwrap();
    if !domain_regex.is_match(&domain) {
        return Err(ApiError::BadRequest("Invalid domain format".to_string()));
    }

    // 2. Parallel Execution (WHOIS & DNS) - NO CACHE for maximum accuracy
    let (whois_res, dns_res) = tokio::join!(
        whois_api_check(&domain),
        dns_check(&domain)
    );

    // 3. Final Logic with better error handling
    let is_available = match (whois_res, dns_res) {
        (Ok(whois), Ok(dns)) => whois && dns,
        (Ok(whois), Err(_)) => whois, // Fallback to WHOIS only
        (Err(_), Ok(dns)) => dns,     // Fallback to DNS only
        (Err(_), Err(e)) => {
            // Both failed - likely a network issue or invalid TLD
            return Err(ApiError::Internal(format!("Check failed: Both WHOIS and DNS protocols were unreachable. {}", e)));
        }
    };

    let result = DomainAvailabilityResponse {
        domain: domain.clone(),
        status: if is_available { "available".to_string() } else { "unavailable".to_string() },
        message: if is_available { "Domain available".to_string() } else { "Domain unavailable".to_string() },
    };

    Ok(Json(result))
}

async fn whois_api_check(domain: &str) -> Result<bool, String> {
    // Attempt dedicated API if key exists
    let api_key = env::var("WHOISXML_API_KEY").ok();
    
    if let Some(key) = api_key {
        let url = format!("https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey={}&domainName={}&outputFormat=JSON", key, domain);
        let client = reqwest::Client::new();
        let resp = client.get(url).timeout(std::time::Duration::from_secs(5)).send().await;
        
        if let Ok(r) = resp {
            if let Ok(json) = r.json::<serde_json::Value>().await {
                if let Some(record) = json.get("WhoisRecord") {
                    // Check if domain is registered by checking createdDate
                    if record.get("createdDate").is_some() {
                        return Ok(false);
                    }
                    // Some APIs return "dataError" for available domains
                    if let Some(err) = record.get("dataError") {
                        if err.as_str().unwrap_or("").contains("MISSING_WHOIS_DATA") {
                            return Ok(true);
                        }
                    }
                }
            }
        }
    }

    // Fallback to Raw WHOIS socket
    raw_whois_check(domain).await
}

async fn raw_whois_check(domain: &str) -> Result<bool, String> {
    let mut stream = TcpStream::connect("whois.iana.org:43").await
        .map_err(|e| e.to_string())?;

    let query_str = format!("{}\r\n", domain);
    stream.write_all(query_str.as_bytes()).await.map_err(|e| e.to_string())?;

    let mut response = String::new();
    stream.read_to_string(&mut response).await.map_err(|e| e.to_string())?;

    Ok(parse_whois_availability(&response))
}

async fn dns_check(domain: &str) -> Result<bool, String> {
    let resolver = AsyncResolver::tokio(ResolverConfig::default(), ResolverOpts::default());
    
    // Check A Record
    let a_check = resolver.lookup_ip(domain).await;
    if a_check.is_ok() {
        return Ok(false); // Found A records -> Taken
    }
    
    // Check NS Record
    let ns_check = resolver.lookup(domain, hickory_resolver::proto::rr::RecordType::NS).await;
    if ns_check.is_ok() {
        return Ok(false); // Found NS records -> Taken
    }

    Ok(true) // No DNS resolution -> Might be available
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

    let admin_email = env::var("ADMIN_NOTIFICATION_EMAIL").unwrap_or_else(|_| "admin@saashouse.com".to_string());
    let subject = format!("New Inquiry: {}", payload.subject);
    let body = format!(
        "New contact form submission\n\nName: {}\nEmail: {}\nSubject: {}\n\nMessage:\n{}",
        payload.full_name, payload.email, payload.subject, payload.message
    );

    send_notification_email(&state.pool, &admin_email, &subject, &body).await?;

    Ok(Json(serde_json::json!({
        "status": "success",
        "message": "Message sent successfully"
    })))
}
