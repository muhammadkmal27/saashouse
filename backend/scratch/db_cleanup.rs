use sqlx::PgPool;
use std::env;
use dotenv::dotenv;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    dotenv().ok();
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let pool = PgPool::connect(&database_url).await?;

    println!("🚀 Memulakan pembersihan pangkalan data (Fresh Launch)...");

    // 1. Padam data operasi secara menyeluruh
    // Mengosongkan jadual transaksi yang tidak melibatkan akaun Admin secara langsung
    let op_tables = vec![
        "billings", 
        "request_comments", 
        "requests", 
        "assets", 
        "projects", 
        "subscriptions", 
        "notifications"
    ];

    for table in op_tables {
        print!("  -> Mengosongkan jadual {}... ", table);
        sqlx::query(&format!("TRUNCATE TABLE {} CASCADE", table)).execute(&pool).await?;
        println!("✅");
    }
    
    println!("✅ Semua data projek, langganan, bil, dan tiket telah dipadamkan.");

    // 2. Padam pengguna (Kecuali Admin)
    // Jadual 'user_profiles', 'otps', dan 'user_preferences' akan terpadam 
    // secara automatik melalui ON DELETE CASCADE dalam skema SQL.
    println!("  -> Membersihkan akaun pengguna bukan Admin...");
    let deleted_users = sqlx::query("DELETE FROM users WHERE role != 'ADMIN'")
        .execute(&pool).await?;

    println!("✅ {} akaun klien (berserta profil & tetapan) berjaya dipadamkan.", deleted_users.rows_affected());

    // 3. Verifikasi Kehadiran Admin
    let remaining = sqlx::query!("SELECT COUNT(*) as count FROM users").fetch_one(&pool).await?;
    let admin_count = remaining.count.unwrap_or(0);
    println!("📊 Status Akhir: {} pengguna (ADMIN) dikekalkan dalam sistem.", admin_count);

    if admin_count == 0 {
        println!("⚠️ AMARAN KRITIKAL: Tiada akaun ADMIN dikesan! Sistem mungkin tidak boleh diakses.");
    } else {
        let admins = sqlx::query!("SELECT email FROM users WHERE role = 'ADMIN'").fetch_all(&pool).await?;
        println!("🔑 Akaun Admin Aktif:");
        for admin in admins {
            println!("   - {}", admin.email);
        }
    }

    println!("\n✨ Fresh Launch Berjaya! Sistem anda sekarang bersih dan sedia untuk operasi baru.");

    Ok(())
}
