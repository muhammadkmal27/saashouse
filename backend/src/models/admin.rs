use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use crate::models::project::ProjectStatus;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct AdminStats {
    pub total_mrr: f64,
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

#[derive(Deserialize, ToSchema)]
pub struct CreateAdminRequest {
    pub email: String,
    pub full_name: String,
    pub password: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct ClientLedgerRow {
    pub id: uuid::Uuid,
    pub full_name: String,
    pub email: String,
    pub project_id: Option<uuid::Uuid>,
    pub project_title: Option<String>,
    pub plan_name: Option<String>,
    pub project_status: Option<ProjectStatus>,
    pub subscription_id: Option<uuid::Uuid>,
    pub subscription_status: Option<String>,
    pub amount: Option<f64>,
    pub created_at: Option<chrono::DateTime<chrono::Utc>>,
}
#[derive(Serialize, Deserialize, ToSchema)]
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
