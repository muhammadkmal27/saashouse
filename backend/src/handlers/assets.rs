use axum::{
    extract::Multipart,
    Json,
};
use std::path::Path;
use tokio::fs::{self, File};
use tokio::io::AsyncWriteExt;
use uuid::Uuid;
use crate::utils::error::ApiError;

#[utoipa::path(
    post,
    path = "/api/assets/upload",
    responses(
        (status = 200, description = "File uploaded successfully")
    ),
    security(
        ("cookieAuth" = [])
    )
)]
pub async fn upload_asset(
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>, ApiError> {
    // Pastikan folder uploads wujud
    if !Path::new("uploads").exists() {
        fs::create_dir_all("uploads").await.map_err(|e| ApiError::Internal(e.to_string()))?;
    }

    let mut urls = Vec::new();

    while let Some(field) = multipart.next_field().await.map_err(|e| ApiError::BadRequest(e.to_string()))? {
        let file_name = field.file_name().unwrap_or("unnamed").to_owned();
        
        // Validation (Security)
        validate_file_extension(&file_name)?;

        let data = field.bytes().await.map_err(|e| ApiError::BadRequest(e.to_string()))?;
        validate_file_size(data.len())?;

        // Rule 22: File Upload Integrity (Magic Bytes Validation)
        let kind = infer::get(&data).ok_or(ApiError::BadRequest("Unknown file type".to_string()))?;
        let mime = kind.mime_type();
        if !mime.starts_with("image/") && mime != "application/pdf" && mime != "application/zip" && !mime.contains("word") && mime != "text/plain" {
             return Err(ApiError::BadRequest(format!("MIME type {} not allowed.", mime)));
        }

        let unique_name = format!("{}_{}", Uuid::new_v4(), file_name.replace(" ", "_"));
        let path = format!("uploads/{}", unique_name);

        // Rule 18: Information Leakage (EXIF removal for images)
        let ext = file_name.split('.').last().unwrap_or("").to_lowercase();
        if ["jpg", "jpeg", "png", "jfif"].contains(&ext.as_str()) {
            if let Ok(img) = image::load_from_memory(&data) {
                img.save(&path).map_err(|e| ApiError::Internal(format!("Failed to save stripped image: {}", e)))?;
            } else {
                // If image parsing fails but extension was image, fallback to raw save or reject
                let mut file = File::create(&path).await.map_err(|e| ApiError::Internal(e.to_string()))?;
                file.write_all(&data).await.map_err(|e| ApiError::Internal(e.to_string()))?;
            }
        } else {
            let mut file = File::create(&path).await.map_err(|e| ApiError::Internal(e.to_string()))?;
            file.write_all(&data).await.map_err(|e| ApiError::Internal(e.to_string()))?;
        }

        urls.push(format!("/uploads/{}", unique_name));
    }

    Ok(Json(serde_json::json!({ "success": true, "files": urls })))
}

pub fn validate_file_extension(file_name: &str) -> Result<(), ApiError> {
    let ext = file_name.split('.').last().unwrap_or("").to_lowercase();
    let allowed = ["pdf", "png", "jpg", "jpeg", "jfif", "doc", "docx", "txt", "zip"];
    if !allowed.contains(&ext.as_str()) {
        return Err(ApiError::BadRequest(format!("File extension .{} not allowed.", ext)));
    }
    Ok(())
}

pub fn validate_file_size(size: usize) -> Result<(), ApiError> {
    const MAX_SIZE: usize = 10 * 1024 * 1024; // 10MB
    if size > MAX_SIZE {
        return Err(ApiError::BadRequest("File capacity exceeded. Maximum allowed size is 10MB for optimized processing.".to_string()));
    }
    Ok(())
}
