pub mod models;
pub mod handlers;
pub mod utils;
pub mod router;

use std::sync::Arc;
use crate::utils::realtime::RealtimeHub;

#[derive(Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub hub: Arc<RealtimeHub>,
}
