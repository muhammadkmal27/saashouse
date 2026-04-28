use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use crate::models::project::ProjectStatus;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct AdminStats {
    pub total_mrr: f64,
    pub total_revenue: f64,
    pub total_clients: i64,
    pub active_projects: i64,
}

#[derive(Deserialize, ToSchema)]
pub struct StatsQuery {
    pub days: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct AdminUpdateProjectRequest {
    pub status: Option<ProjectStatus>,
    pub dev_url: Option<String>,
    pub prod_url: Option<String>,
}

use validator::Validate;

#[derive(Deserialize, ToSchema, Validate)]
pub struct CreateAdminRequest {
    #[validate(email(message = "Format emel tidak sah"))]
    pub email: String,
    
    #[validate(length(min = 3, message = "Nama penuh terlalu pendek"))]
    pub full_name: String,
    
    #[validate(length(min = 8, message = "Kata laluan mestilah sekurang-kurangnya 8 aksara"))]
    #[validate(custom(function = "crate::utils::validation::validate_password_complexity", message = "Kata laluan mesti mengandungi sekurang-kurangnya satu nombor dan satu simbol"))]
    pub password: String,
}

#[derive(Serialize, Deserialize, ToSchema, sqlx::FromRow)]
pub struct ClientLedgerRow {
    pub id: uuid::Uuid,
    pub row_id: Option<i64>,
    pub full_name: String,
    pub email: String,
    pub project_id: Option<uuid::Uuid>,
    pub project_title: Option<String>,
    pub plan_name: Option<String>,
    pub project_status: Option<ProjectStatus>,
    pub subscription_id: Option<uuid::Uuid>,
    pub subscription_status: Option<String>,
    pub amount: Option<f64>,
    pub payment_source: Option<String>,
    pub description: Option<String>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct AdminProjectRow {
    pub id: uuid::Uuid,
    pub title: String,
    pub description: Option<String>,
    pub whatsapp_number: Option<String>,
    pub client_name: String,
    pub client_email: String,
    pub plan_name: Option<String>,
    pub status: ProjectStatus,
    pub dev_url: Option<String>,
    pub prod_url: Option<String>,
    pub subscription_status: Option<String>,
    pub client_edit_allowed: bool,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}

#[derive(Deserialize, ToSchema)]
pub struct UpdatePermissionRequest {
    pub allowed: bool,
}
