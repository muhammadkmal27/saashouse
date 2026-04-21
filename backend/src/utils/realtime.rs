use serde::{Deserialize, Serialize};
use tokio::sync::broadcast;
use uuid::Uuid;
use crate::models::requests::RequestComment;

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
