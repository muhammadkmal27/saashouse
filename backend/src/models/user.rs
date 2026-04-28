use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use chrono::{DateTime, Utc};
use uuid::Uuid;
use validator::Validate;

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::Type, Clone, PartialEq)]
#[sqlx(type_name = "user_role", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum UserRole {
    Client,
    Admin,
}

impl std::fmt::Display for UserRole {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            UserRole::Client => write!(f, "CLIENT"),
            UserRole::Admin => write!(f, "ADMIN"),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: Option<String>,
    pub google_id: Option<String>,
    pub role: UserRole,
    pub is_active: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow, Validate)]
pub struct UserProfile {
    pub user_id: Uuid,
    
    #[validate(length(min = 3, message = "Nama terlalu pendek"))]
    pub full_name: String,
    
    pub company_name: Option<String>,
    
    #[validate(length(min = 10, max = 15, message = "No telefon tidak sah"))]
    pub phone_number: Option<String>,
    
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow, Validate)]
pub struct UserPreferences {
    pub user_id: Uuid,
    pub project_updates: bool,
    pub billing_alerts: bool,
    pub security_alerts: bool,
    pub updated_at: Option<DateTime<Utc>>,
}
