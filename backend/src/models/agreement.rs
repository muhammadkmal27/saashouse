use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
pub struct ServiceAgreement {
    pub id: Uuid,
    pub project_id: Uuid,
    pub user_id: Uuid,
    pub client_name: String,
    pub provider_name: String,
    pub project_name: String,
    pub total_cost: f64,
    pub deposit_amount: f64,
    pub balance_amount: f64,
    pub signed_at: Option<DateTime<Utc>>,
    pub signature_data: Option<String>,
    pub provider_signature: Option<String>,
    pub plan_name: Option<String>,
}

#[derive(Debug, Deserialize, ToSchema)]
pub struct SignAgreementRequest {
    pub client_name: String,
    pub signature_data: String,
    pub plan_name: Option<String>,
}
