use reqwest;
use serde_json::json;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let url = "http://localhost:8080/api/admin/projects/e240978d-195c-4404-b835-c58cc92a773a";
    
    println!("--- Testing PATCH request to {} ---", url);
    let res = client.patch(url)
        .json(&json!({
            "dev_url": "https://debug-manual.com",
            "status": "REVIEW"
        }))
        .send()
        .await?;

    println!("Status: {}", res.status());
    let body = res.text().await?;
    println!("Body: {}", body);

    Ok(())
}
