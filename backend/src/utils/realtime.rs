use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use uuid::Uuid;
use crate::models::requests::RequestComment;
use crate::models::project::ProjectStatus;

use crate::models::admin::AdminProjectRow;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum RealtimeEvent {
    NewComment {
        request_id: Uuid,
        comment: RequestComment,
    },
    TicketStatusUpdate {
        request_id: Uuid,
        status: String,
    },
    StatusPulse {
        request_id: Uuid,
    },
    ReadSync {
        request_id: Uuid,
    },
    ProjectPermissionUpdate {
        project_id: Uuid,
        allowed: bool,
    },
    ProjectDataUpdate {
        project_id: Uuid,
        status: ProjectStatus,
        dev_url: Option<String>,
        prod_url: Option<String>,
    },
    NewProject {
        project: AdminProjectRow,
    },
    Ping,
}

pub struct RealtimeHub {
    pub tx: broadcast::Sender<RealtimeEvent>,
}

impl RealtimeHub {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(100);
        Self { tx }
    }
}
