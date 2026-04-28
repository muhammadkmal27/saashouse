pub mod models;
pub mod handlers;
pub mod utils;
pub mod router;
#[cfg(test)]
mod tests;

use std::sync::Arc;
use crate::utils::realtime::RealtimeHub;

#[derive(Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub redis: redis::Client,
    pub hub: Arc<RealtimeHub>,
}
