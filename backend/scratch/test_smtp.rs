use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, AsyncSmtpTransport, AsyncTransport, Tokio1Executor};
use dotenvy::dotenv;
use std::env;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    
    let host = env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.gmail.com".to_string());
    let port = env::var("SMTP_PORT").unwrap_or_else(|_| "465".to_string()).parse::<u16>().unwrap_or(465);
    let user = env::var("SMTP_USER").expect("SMTP_USER not set");
    let password = env::var("SMTP_PASS").expect("SMTP_PASS not set");
    let from = env::var("SMTP_FROM").unwrap_or_else(|_| "no-reply@saashouse.com".to_string());

    println!("Testing SMTP with:");
    println!("Host: {}", host);
    println!("Port: {}", port);
    println!("User: [{}]", user);
    println!("From: {}", from);

    let email = Message::builder()
        .from(format!("SaaS House <{}>", from).parse()?)
        .to(user.parse()?) // Send to self
        .subject("SMTP Test")
        .body("This is a test email from SaaS House diagnostic script.".to_string())?;

    let creds = Credentials::new(user.clone(), password.clone());
    let protocol = if port == 465 { "smtps" } else { "smtp" };
    let mailer_url = format!("{}://{}", protocol, host);

    let mailer: AsyncSmtpTransport<Tokio1Executor> = AsyncSmtpTransport::<Tokio1Executor>::from_url(&mailer_url)?
        .port(port)
        .credentials(creds)
        .build();

    match mailer.send(email).await {
        Ok(_) => println!("✅ SMTP test successful!"),
        Err(e) => println!("❌ SMTP test failed: {}", e),
    }

    Ok(())
}
