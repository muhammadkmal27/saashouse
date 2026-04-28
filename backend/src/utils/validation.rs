use validator::ValidationError;

pub fn validate_password_complexity(password: &str) -> Result<(), ValidationError> {
    let has_number = password.chars().any(|c| c.is_digit(10));
    let has_special = password.chars().any(|c| !c.is_alphanumeric());
    
    if !has_number || !has_special {
        return Err(ValidationError::new("password_too_weak"));
    }
    Ok(())
}
