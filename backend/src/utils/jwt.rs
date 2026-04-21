use jsonwebtoken::{encode, decode, Header, EncodingKey, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{Utc, Duration};
use crate::utils::error::ApiError;
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub exp: usize,
    pub role: String,
    pub is_2fa_verified: bool,
}

pub fn create_token(user_id: Uuid, role: String, is_2fa_verified: bool) -> Result<String, ApiError> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "SUPER_SECRET_CHANGE_ME".to_string());
    
    let claims = Claims {
        sub: user_id,
        exp: (Utc::now() + Duration::hours(24)).timestamp() as usize,
        role,
        is_2fa_verified,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes())
    ).map_err(|e| ApiError::Internal(e.to_string()))
}

pub fn verify_token(token: &str) -> Result<Claims, ApiError> {
    let secret = env::var("JWT_SECRET").unwrap_or_else(|_| "SUPER_SECRET_CHANGE_ME".to_string());
    
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::default()
    ).map_err(|_| ApiError::Unauthorized)?;

    Ok(token_data.claims)
}
