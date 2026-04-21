use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::Type, Clone, PartialEq, Eq)]
#[sqlx(type_name = "project_status", rename_all = "SCREAMING_SNAKE_CASE")]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ProjectStatus {
    Draft,
    Onboarding,
    PaymentPending,
    Paid,
    UnderDevelopment,
    Review,
    Live,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
pub struct Project {
    pub id: Uuid,
    pub client_id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub whatsapp_number: Option<String>,
    pub requirements: Option<serde_json::Value>,
    pub status: ProjectStatus,
    pub dev_url: Option<String>,
    pub prod_url: Option<String>,
    pub subscription_status: Option<String>,
    pub selected_plan: Option<String>,
    pub client_edit_allowed: bool,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema, Clone)]
pub struct RequirementsPayload {
    pub payment_setup: Option<serde_json::Value>, // Optional SSM detail or ToyyibPay keys
    #[serde(default)]
    pub features: Vec<String>,
    pub custom_needs: Option<String>,
    #[serde(default)]
    pub sitemap: Vec<String>,
    pub brand_assets: Option<serde_json::Value>, // Colors, Logo URL
    pub domain_requested: Option<String>,
    pub domain_2: Option<String>,
    pub domain_3: Option<String>,
    pub competitor_ref: Option<String>,
    pub social_media: Option<serde_json::Value>,
    pub business_email: Option<String>,
    pub business_address: Option<String>,
    pub operation_hours: Option<String>,
    pub project_vision: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateProjectRequest {
    #[schema(example = "E-Commerce Website")]
    pub title: String,
    #[schema(example = "Full stack application with payment integration.")]
    pub description: Option<String>,
    
    #[schema(example = "60123456789")]
    pub whatsapp_number: String,
    
    #[schema(example = "Growth")]
    pub selected_plan: Option<String>,
    
    pub requirements: RequirementsPayload,
}
