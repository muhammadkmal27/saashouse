use sqlx::postgres::PgPoolOptions;
use dotenv::dotenv;
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2
};
use std::env;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL")?;
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    let email = "akmallmuhammad27@gmail.com";
    let password = "Admin123!";
    
    let salt = SaltString::from_b64("c2FsdHNhbHRzYWx0").map_err(|e| e.to_string())?; 
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();

    let user_id = Uuid::new_v4();
    sqlx::query!(
        "INSERT INTO users (id, email, password_hash, role) 
         VALUES ($1, $2, $3, 'ADMIN') 
         ON CONFLICT (email) DO UPDATE SET password_hash = $3, role = 'ADMIN'",
        user_id,
        email,
        password_hash
    )
    .execute(&pool)
    .await?;

    // Pastikan user_profiles juga wujud
    sqlx::query!(
        "INSERT INTO user_profiles (user_id, full_name) VALUES ($1, 'Admin SaaS') ON CONFLICT (user_id) DO NOTHING",
        user_id
    )
    .execute(&pool)
    .await?;

    println!("User {} updated/created successfully as ADMIN with password 'Admin123!'", email);

    Ok(())
}
