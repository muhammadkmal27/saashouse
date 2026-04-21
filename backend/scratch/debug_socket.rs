use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum RealtimeEvent {
    TicketStatusUpdate {
        request_id: Uuid,
        status: String,
    },
}

fn main() {
    let id = Uuid::new_v4();
    let event = RealtimeEvent::TicketStatusUpdate {
        request_id: id,
        status: "CLOSED".to_string(),
    };
    println!("{}", serde_json::to_string(&event).unwrap());
}
