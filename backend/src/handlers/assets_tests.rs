#[cfg(test)]
mod tests {
    use crate::handlers::assets::{validate_file_extension, validate_file_size};

    #[test]
    fn test_validate_file_extension_success() {
        assert!(validate_file_extension("document.pdf").is_ok());
        assert!(validate_file_extension("image.jpg").is_ok());
        assert!(validate_file_extension("archive.zip").is_ok());
        assert!(validate_file_extension("UPPERCASE.PNG").is_ok());
    }

    #[test]
    fn test_validate_file_extension_failure() {
        let result = validate_file_extension("exploit.exe");
        assert!(result.is_err());
        
        let result = validate_file_extension("malicious.sh");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_file_size_success() {
        assert!(validate_file_size(1024).is_ok()); // 1KB
        assert!(validate_file_size(10 * 1024 * 1024).is_ok()); // 10MB
    }

    #[test]
    fn test_validate_file_size_failure() {
        let result = validate_file_size(10 * 1024 * 1024 + 1);
        assert!(result.is_err());
    }
}
