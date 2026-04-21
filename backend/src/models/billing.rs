use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize, ToSchema, sqlx::FromRow)]
pub struct Subscription {
    pub id: Uuid,
    pub client_id: Uuid,
    pub project_id: Option<Uuid>,
    pub stripe_sub_id: Option<String>,
    pub plan_name: Option<String>,
    pub status: Option<String>,
    pub current_period_end: Option<DateTime<Utc>>,
    pub cancel_at_period_end: Option<bool>,
    pub created_at: Option<DateTime<Utc>>,
    pub updated_at: Option<DateTime<Utc>>,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct AutoRenewRequest {
    #[schema(example = true)]
    pub cancel_at_period_end: bool,
}
