use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Serialize, Deserialize, ToSchema)]
pub struct RegisterRequest {
    #[schema(example = "john@example.com")]
    pub email: String,
    #[schema(example = "secure_password_123")]
    pub password: String,
    #[schema(example = "John Doe")]
    pub full_name: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct LoginRequest {
    #[schema(example = "john@example.com")]
    pub email: String,
    #[schema(example = "secure_password_123")]
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct AuthResponse {
    #[schema(example = "Success")]
    pub message: String,
}

#[derive(Serialize, Deserialize, ToSchema)]
pub struct Verify2FARequest {
    #[schema(example = "123456")]
    pub code: String,
}
