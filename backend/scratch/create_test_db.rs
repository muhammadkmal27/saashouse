use sqlx::{postgres::PgPoolOptions, Executor};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let admin_url = "postgres://root:rootpassword@localhost:5432/postgres";
    let pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(admin_url)
        .await?;

    println!("Connecting to PostgreSQL as admin...");
    
    // Check if database exists
    let exists: bool = sqlx::query_scalar("SELECT EXISTS (SELECT FROM pg_database WHERE datname = 'saashouse_test')")
        .fetch_one(&pool)
        .await?;

    if exists {
        println!("Dropping existing saashouse_test database...");
        // Close connections to the database to allow dropping
        pool.execute("SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = 'saashouse_test' AND pid <> pg_backend_pid();").await?;
        pool.execute("DROP DATABASE saashouse_test;").await?;
    }
    
    println!("Creating database saashouse_test...");
    pool.execute("CREATE DATABASE saashouse_test;").await?;
    println!("Database created successfully.");

    // Connect to the new database to run migrations
    let test_db_url = "postgres://root:rootpassword@localhost:5432/saashouse_test";
    let test_pool = PgPoolOptions::new()
        .max_connections(1)
        .connect(test_db_url)
        .await?;

    println!("Running migrations on saashouse_test...");
    sqlx::migrate!("./migrations")
        .run(&test_pool)
        .await?;
    println!("Migrations completed successfully.");

    Ok(())
}
