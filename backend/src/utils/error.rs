use axum::{
    http::StatusCode,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;

#[derive(Debug)]
pub enum ApiError {
    Internal(String),
    EmailExists,
    InvalidCredentials,
    Unauthorized,
    Forbidden(String),
    BadRequest(String),
    NotFound(String),
}

impl std::fmt::Display for ApiError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ApiError::Internal(msg) => write!(f, "Internal Error: {}", msg),
            ApiError::EmailExists => write!(f, "Email already exists"),
            ApiError::InvalidCredentials => write!(f, "Invalid credentials"),
            ApiError::Unauthorized => write!(f, "Unauthorized"),
            ApiError::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
            ApiError::BadRequest(msg) => write!(f, "Bad Request: {}", msg),
            ApiError::NotFound(msg) => write!(f, "Not Found: {}", msg),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, error_message) = match self {
            ApiError::Internal(err) => {
                println!("ERROR [Internal]: {}", err);
                (StatusCode::INTERNAL_SERVER_ERROR, "An internal server error occurred".to_string())
            }
            ApiError::EmailExists => (StatusCode::CONFLICT, "Email is already registered".to_string()),
            ApiError::InvalidCredentials => (StatusCode::UNAUTHORIZED, "Invalid email or password".to_string()),
            ApiError::Unauthorized => {
                println!("ERROR [Unauthorized]: Request blocked by auth middleware");
                (StatusCode::UNAUTHORIZED, "Unauthorized access".to_string())
            }
            ApiError::Forbidden(msg) => {
                println!("ERROR [Forbidden]: {}", msg);
                (StatusCode::FORBIDDEN, msg)
            }
            ApiError::BadRequest(msg) => {
                println!("ERROR [BadRequest]: {}", msg);
                (StatusCode::BAD_REQUEST, msg)
            }
            ApiError::NotFound(msg) => {
                println!("ERROR [NotFound]: {}", msg);
                (StatusCode::NOT_FOUND, msg)
            }
        };

        let body = Json(json!({ "error": error_message }));
        (status, body).into_response()
    }
}
