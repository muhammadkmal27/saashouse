use async_trait::async_trait;
use sqlx::PgPool;
use crate::models::user::User;
use crate::utils::error::ApiError;

#[async_trait]
pub trait RegistrationRepo: Send + Sync {
    async fn check_email_exists(&self, email: &str) -> Result<bool, ApiError>;
    async fn create_user_with_profile(
        &self, 
        email: &str, 
        password_hash: &str, 
        full_name: &str
    ) -> Result<User, ApiError>;
}

pub struct SqlxRegistrationRepo {
    pool: PgPool,
}

impl SqlxRegistrationRepo {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl RegistrationRepo for SqlxRegistrationRepo {
    async fn check_email_exists(&self, email: &str) -> Result<bool, ApiError> {
        let existing: Option<User> = sqlx::query_as("SELECT * FROM users WHERE email = $1")
            .bind(email)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?;
        Ok(existing.is_some())
    }

    async fn create_user_with_profile(
        &self, 
        email: &str, 
        password_hash: &str, 
        full_name: &str
    ) -> Result<User, ApiError> {
        let mut tx = self.pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

        let user: User = sqlx::query_as(r#"
            INSERT INTO users (email, password_hash, role) 
            VALUES ($1, $2, 'CLIENT') RETURNING *
        "#).bind(email).bind(password_hash)
           .fetch_one(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;
           
        sqlx::query("INSERT INTO user_profiles (user_id, full_name) VALUES ($1, $2)")
            .bind(&user.id).bind(full_name)
            .execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

        tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;
        Ok(user)
    }
}
