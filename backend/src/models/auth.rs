use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use validator::Validate;

#[derive(Serialize, Deserialize, ToSchema, Validate)]
pub struct RegisterRequest {
    #[schema(example = "john@example.com")]
    #[validate(email(message = "Sila masukkan emel yang sah"))]
    pub email: String,
    
    #[schema(example = "SecurePass!123")]
    #[validate(length(min = 8, message = "Kata laluan mestilah sekurang-kurangnya 8 aksara"))]
    #[validate(custom(function = "crate::utils::validation::validate_password_complexity", message = "Kata laluan mesti mengandungi sekurang-kurangnya satu nombor dan satu simbol"))]
    pub password: String,
    
    #[schema(example = "John Doe")]
    #[validate(length(min = 3, message = "Nama penuh terlalu pendek"))]
    pub full_name: String,
}

#[derive(Serialize, Deserialize, ToSchema, Validate)]
pub struct LoginRequest {
    #[schema(example = "john@example.com")]
    #[validate(email(message = "Format emel tidak sah"))]
    pub email: String,
    
    #[schema(example = "secure_password_123")]
    #[validate(length(min = 1, message = "Sila masukkan kata laluan"))]
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct AuthResponse {
    #[schema(example = "Success")]
    pub message: String,
    pub csrf_token: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Validate)]
pub struct Verify2FARequest {
    #[schema(example = "123456")]
    #[validate(length(equal = 6, message = "Kod OTP mestilah 6 angka"))]
    pub code: String,
}

#[derive(Serialize, Deserialize, ToSchema, Validate)]
pub struct ForgotPasswordRequest {
    #[schema(example = "john@example.com")]
    #[validate(email(message = "Format emel tidak sah"))]
    pub email: String,
}

#[derive(Serialize, Deserialize, ToSchema, Validate)]
pub struct ResetPasswordRequest {
    #[schema(example = "a1b2c3d4...")]
    pub token: String,

    #[schema(example = "NewSecurePass!123")]
    #[validate(length(min = 8, message = "Kata laluan mestilah sekurang-kurangnya 8 aksara"))]
    #[validate(custom(function = "crate::utils::validation::validate_password_complexity", message = "Kata laluan mesti mengandungi sekurang-kurangnya satu nombor dan satu simbol"))]
    pub new_password: String,
}
