#[cfg(test)]
mod tests {
    use crate::utils::jwt::{create_token, verify_token, Claims};
    use uuid::Uuid;
    use jsonwebtoken::{encode, Header, EncodingKey};
    use chrono::{Utc, Duration};
    use std::env;

    fn setup() {
        env::set_var("JWT_SECRET", "test_secret_for_unit_testing");
    }

    #[tokio::test]
    async fn test_jwt_creation_verification() {
        setup();
        let user_id = Uuid::new_v4();
        let role = "CLIENT".to_string();
        
        let token = create_token(user_id, role.clone(), true).expect("Failed to create token");
        let decoded = verify_token(&token).expect("Failed to verify token");
        
        assert_eq!(decoded.sub, user_id);
        assert_eq!(decoded.role, role);
        assert!(decoded.is_2fa_verified);
    }

    #[tokio::test]
    async fn test_jwt_invalid_signature() {
        setup();
        let user_id = Uuid::new_v4();
        
        // Create token with secret A
        let token = create_token(user_id, "CLIENT".to_string(), true).expect("Failed to create token");
        
        // Change secret to B
        env::set_var("JWT_SECRET", "WRONG_SECRET_B");
        
        let result = verify_token(&token);
        assert!(result.is_err(), "Verification should fail with wrong secret");
    }

    #[tokio::test]
    async fn test_jwt_expired() {
        setup();
        let user_id = Uuid::new_v4();
        let secret = env::var("JWT_SECRET").unwrap();

        // Forge an expired token manually
        let claims = Claims {
            sub: user_id,
            exp: (Utc::now() - Duration::hours(1)).timestamp() as usize, // 1 hour ago
            role: "CLIENT".to_string(),
            is_2fa_verified: true,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(secret.as_bytes())
        ).expect("Failed to forge token");

        let result = verify_token(&token);
        assert!(result.is_err(), "Verification should fail for expired token");
    }

    #[tokio::test]
    async fn test_jwt_tampered_data() {
        setup();
        let user_id = Uuid::new_v4();
        let secret = env::var("JWT_SECRET").unwrap();

        // Create valid token
        let token = create_token(user_id, "CLIENT".to_string(), true).expect("Failed to create token");
        
        // Split token (header.payload.signature)
        let parts: Vec<&str> = token.split('.').collect();
        
        // Manually forge a payload with a different role (ADMIN) but original signature
        let tampered_claims = Claims {
            sub: user_id,
            exp: (Utc::now() + Duration::hours(1)).timestamp() as usize,
            role: "ADMIN".to_string(),
            is_2fa_verified: true,
        };
        
        use base64::{Engine as _, engine::general_purpose};
        let tampered_payload = general_purpose::STANDARD.encode(serde_json::to_string(&tampered_claims).unwrap());
        let tampered_token = format!("{}.{}.{}", parts[0], tampered_payload, parts[2]);

        let result = verify_token(&tampered_token);
        assert!(result.is_err(), "Verification should fail for tampered payload due to signature mismatch");
    }
}
