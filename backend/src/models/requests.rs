use serde::{Deserialize, Serialize};
use sqlx::Type;
use utoipa::ToSchema;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, Type, ToSchema)]
#[sqlx(type_name = "request_type")]
pub enum RequestType {
    BUG,
    FIX,
    FEATURE,
}

#[derive(Debug, Clone, Serialize, Deserialize, Type, ToSchema, PartialEq, Eq)]
#[sqlx(type_name = "request_status", rename_all = "SCREAMING_SNAKE_CASE")]
pub enum RequestStatus {
    Open,
    InProgress,
    Resolved,
    Closed,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct Request {
    pub id: Uuid,
    pub project_id: Uuid,
    pub created_by: Uuid,
    pub creator_email: Option<String>,
    pub type_: RequestType,
    pub status: RequestStatus,
    pub title: String,
    pub description: String,
    pub attachment_urls: Option<Vec<String>>,
    pub unread_count: Option<i64>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateRequest {
    pub project_id: Uuid,
    pub type_: RequestType,
    pub title: String,
    pub description: String,
    pub attachment_urls: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct RequestComment {
    pub id: Uuid,
    pub request_id: Uuid,
    pub user_id: Uuid,
    pub message: String,
    pub attachment_urls: Option<Vec<String>>,
    pub is_read: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct CreateCommentRequest {
    pub message: String,
    pub attachment_urls: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct UpdateStatusRequest {
    pub status: RequestStatus,
}
