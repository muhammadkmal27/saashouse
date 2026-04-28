use argon2::{
    password_hash::{rand_core::OsRng, PasswordHasher, SaltString, PasswordVerifier, PasswordHash},
    Argon2
};
use crate::utils::error::ApiError;

pub fn hash_password(password: &str) -> Result<String, ApiError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    Ok(argon2.hash_password(password.as_bytes(), &salt)
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .to_string())
}

pub fn verify_password(password: &str, hash: &str) -> Result<bool, ApiError> {
    let parsed_hash = PasswordHash::new(hash)
        .map_err(|e| ApiError::Internal(e.to_string()))?;
    let argon2 = Argon2::default();
    Ok(argon2.verify_password(password.as_bytes(), &parsed_hash).is_ok())
}
