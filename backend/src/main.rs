use backend::AppState;
use backend::router;
use backend::utils::realtime::RealtimeHub;
use sqlx::postgres::PgPoolOptions;
use sqlx::PgPool;
use std::env;
use std::sync::Arc;
use argon2::{
    password_hash::{PasswordHasher, SaltString},
    Argon2,
};


#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    
    // Connect to PostgreSQL
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Failed to connect to Postgres!");

    // Run database migrations automatically
    sqlx::migrate!()
        .run(&pool)
        .await
        .expect("Failed to run database migrations!");
    println!("✅ Database migrations applied successfully");

    // Seed admin account if it doesn't exist
    if let Err(e) = seed_admin(&pool).await {
        eprintln!("⚠️ Admin seed warning: {}", e);
    }

    // Seed system settings (agreement templates, etc)
    if let Err(e) = seed_settings(&pool).await {
        eprintln!("⚠️ Settings seed warning: {}", e);
    }

    // Initialize Realtime Hub
    let hub = Arc::new(RealtimeHub::new());
    
    // Connect to Redis (Rule 17)
    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1/".to_string());
    let redis_client = redis::Client::open(redis_url).expect("Invalid Redis URL");

    let state = AppState {
        pool: pool.clone(),
        redis: redis_client,
        hub,
    };

    // Build our application with router
    let app = router::create_router(state);

    // Run our app with hyper, listening globally on port 8080
    let listener = tokio::net::TcpListener::bind("0.0.0.0:8080").await.unwrap();
    println!("API listening on http://0.0.0.0:8080");
    println!("Swagger UI available at http://0.0.0.0:8080/swagger-ui");
    axum::serve(listener, app).await.unwrap();
}

/// Seeds the default admin account if no admin user exists in the database.
/// Uses ON CONFLICT DO NOTHING to ensure idempotency — safe to run on every startup.
async fn seed_admin(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let admins = vec![
        ("akmallmuhammad27@gmail.com", "Admin SaaS 1"),
        ("mdsykr8894@gmail.com", "Admin SaaS 2"),
    ];
    let admin_password = "Admin123!";

    // Check if any admin already exists
    let existing_admin = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM users WHERE role = 'ADMIN'"
    )
    .fetch_one(pool)
    .await?;

    if existing_admin > 0 {
        println!("✅ Admin accounts already exist, skipping seed");
        return Ok(());
    }

    // Hash the password using Argon2
    let salt = SaltString::from_b64("c2FsdHNhbHRzYWx0")
        .map_err(|e| format!("Salt error: {}", e))?;
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(admin_password.as_bytes(), &salt)
        .map_err(|e| format!("Hash error: {}", e))?
        .to_string();

    for (email, name) in admins {
        let user_id = uuid::Uuid::new_v4();

        // Insert admin user
        sqlx::query(
            "INSERT INTO users (id, email, password_hash, role) 
             VALUES ($1, $2, $3, 'ADMIN') 
             ON CONFLICT (email) DO NOTHING"
        )
        .bind(user_id)
        .bind(email)
        .bind(&password_hash)
        .execute(pool)
        .await?;

        // Insert admin profile
        sqlx::query(
            "INSERT INTO user_profiles (user_id, full_name) 
             VALUES ($1, $2) 
             ON CONFLICT (user_id) DO NOTHING"
        )
        .bind(user_id)
        .bind(name)
        .execute(pool)
        .await?;

        println!("✅ Admin account seeded: {}", email);
    }

    Ok(())
}

/// Seeds default system settings like agreement templates if they don't exist.
async fn seed_settings(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    let otp_template = serde_json::json!([
        {
            "title": "SKOP KERJA & TEKNOLOGI",
            "content": "- **Jenis Projek:** {{project_name}}\n- **Teknologi:** Laravel/Axum (Backend) dan Next Js (Frontend).\n- **Tempoh Pembangunan:** 30 hari bekerja bermula dari tarikh bayaran deposit diterima dan disahkan."
        },
        {
            "title": "STRUKTUR PEMBAYARAN (ONE-OFF)",
            "content": "**Total Kos Projek: RM {{total_cost}}**\n\n- **Deposit (30%):** RM {{deposit_amount}} – Dibayar sebelum kerja dimulakan.\n- **Baki Akhir (70%):** RM {{balance_amount}} – Dibayar selepas projek siap, diuji (UAT), dan sebelum penyerahan akses penuh (Go-Live)."
        },
        {
            "title": "PINDAAN (REVISIONS)",
            "content": "Semasa Pembangunan: Pelanggan berhak mendapat pindaan tanpa had secara percuma selagi tidak lari dari skop asal.\n\nSekiranya tempoh 30 hari pembangunan asal telah tamat, sebarang permintaan penambahan atau perubahan ciri (feature) baru akan dikenakan cas mengikut skala berikut:\n\n- **Small Change Request:** RM50.00 - RM200.00 per permintaan.\n- **Medium Change Request:** RM200.00 - RM500.00 per permintaan.\n- **Large Change Request:** RM500.00 - RM1,500.00 per permintaan."
        },
        {
            "title": "PEMILIKAN KOD & HAK CIPTA (OWNERSHIP)",
            "content": "- **Penyerahan Hak:** Setelah bayaran penuh dijelaskan, segala Hak Milik Mutlak ke atas kod sumber (source code) dan aset digital akan diserahkan kepada Pelanggan.\n- **Penyimpanan:** Penyedia Perkhidmatan tidak bertanggungjawab menyimpan salinan kod selepas penyerahan dilakukan."
        },
        {
            "title": "DOMAIN, HOSTING & PENYELENGGARAAN",
            "content": "- **Tanggungjawab Pelanggan:** Kos tahunan bagi Nama Domain dan Server/Hosting adalah tanggungan Pelanggan sepenuhnya.\n- **Sokongan Teknikal (Warranty):** Penyedia Perkhidmatan menyediakan sokongan teknik percuma selama 90 hari selepas projek tamat bagi membaiki ralat (bugs) sahaja."
        },
        {
            "title": "HAD LIABILITI",
            "content": "Penyedia Perkhidmatan tidak bertanggungjawab ke atas sebarang kerugian keuntungan atau gangguan perniagaan yang disebabkan oleh masalah teknikal pihak ketiga (contoh: gangguan server, API sistem pembayaran, atau gangguan internet global)."
        }
    ]);

    let saas_template = serde_json::json!([
        {
            "title": "SKOP KERJA & TEKNOLOGI",
            "content": "- **Jenis Projek:** {{project_name}}\n- **Teknologi:** Laravel/Axum (Backend) dan Next Js (Frontend).\n- **Tempoh Pembangunan:** 30 hari bekerja bermula dari tarikh bayaran pertama diterima dan disahkan."
        },
        {
            "title": "MODEL PEMBAYARAN & FASA PEMBANGUNAN",
            "content": "- **Bayaran Pendahuluan:** Pelanggan wajib mula melanggan sebelum fasa pembangunan dimulakan.\n- **Fasa Pembangunan:** Pembangunan website hanya akan dimulakan secara rasmi selepas bayaran bulan pertama berjaya disahkan melalui sistem.\n- **Unlimited Revisions:** Dalam tempoh 30 hari pembangunan, Pelanggan berhak meminta pindaan atau penambahan ciri (feature) tanpa had dan tanpa cas tambahan selagi tidak mengubah struktur/kategori asal projek yang telah dipersetujui."
        },
        {
            "title": "YURAN LANGGANAN & PENYELENGGARAAN (SAAS)",
            "content": "- **Yuran Bulanan:** **RM {{deposit_amount}}** sebulan (Auto-billing melalui sistem Stripe).\n- **Merangkumi:** Sewaan Server (VPS), Nama Domain, Sijil SSL (Security), Penyelenggaraan Sistem, dan Pemantauan Keselamatan.\n- **Jaminan Ralat (Bugs):** Penyedia Perkhidmatan bertanggungjawab sepenuhnya ke atas pembetulan ralat teknikal (bugs) tanpa sebarang cas tambahan dan tanpa had tempoh selagi langganan masih aktif."
        },
        {
            "title": "PINDAAN SELEPAS TEMPOH PEMBANGUNAN (CHANGE REQUEST)",
            "content": "Sekiranya tempoh 30 hari pembangunan asal telah tamat, sebarang permintaan penambahan atau perubahan ciri (feature) baru akan dikenakan cas mengikut skala berikut:\n\n- **Small Change Request:** RM50.00 - RM200.00 per permintaan.\n- **Medium Change Request:** RM200.00 - RM500.00 per permintaan.\n- **Large Change Request:** RM500.00 - RM1,500.00 per permintaan."
        },
        {
            "title": "PEMILIKAN KOD & DATA (PROPRIETARY RIGHTS)",
            "content": "- **Pemilikan Kod:** Segala kod sumber (source code), reka bentuk sistem, dan logik pengaturcaraan adalah **HAK MILIK MUTLAK** Penyedia Perkhidmatan. Pelanggan dikira menyewa sistem/laman web tersebut sepanjang tempoh langganan aktif.\n- **Data Pelanggan:** Segala data perniagaan, maklumat pelanggan, dan pangkalan data jualan adalah hak milik penuh Pelanggan."
        },
        {
            "title": "PEMBATALAN & PENANGGUHAN AKSES",
            "content": "- **Kegagalan Bayaran:** Sekiranya langganan bulanan gagal dijelaskan pada tarikh matang, akses laman web akan digantung (suspend) secara automatik sehingga bayaran tunggakan diselesaikan.\n- **Penamatan:** Pelanggan berhak menamatkan langganan/sewaan pada bila-bila masa tanpa sebarang notis. Pelanggan bertanggungjawab untuk mematikan fungsi auto-billing di dalam portal pelanggan bagi menghentikan caj masa hadapan."
        },
        {
            "title": "HAD LIABILITI",
            "content": "Penyedia Perkhidmatan tidak bertanggungjawab ke atas sebarang kerugian keuntungan atau gangguan perniagaan yang disebabkan oleh masalah teknikal pihak ketiga (contoh: gangguan server, API sistem pembayaran, atau gangguan internet global)."
        }
    ]);

    let settings = vec![
        ("agreement_template_otp", otp_template),
        ("agreement_template_saas", saas_template),
    ];

    for (key, value) in settings {
        sqlx::query(
            "INSERT INTO system_settings (key, value, updated_at) 
             VALUES ($1, $2, NOW()) 
             ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()"
        )
        .bind(key)
        .bind(value)
        .execute(pool)
        .await?;
        println!("✅ System setting updated: {}", key);
    }

    Ok(())
}
