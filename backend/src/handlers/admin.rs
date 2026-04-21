use axum::{extract::{State, Path, Query}, Json};
use crate::AppState;
use crate::models::admin::{AdminStats, AdminUpdateProjectRequest, CreateAdminRequest, ClientLedgerRow, AdminProjectRow, UpdatePermissionRequest, StatsQuery};
use crate::models::project::{Project, ProjectStatus};
use crate::utils::error::ApiError;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, SaltString},
    Argon2
};
use crate::models::auth::AuthResponse;

#[utoipa::path(
    get,
    path = "/api/admin/stats",
    params(
        ("days" = i32, Query, description = "Number of days to look back for stats calculation")
    ),
    responses(
        (status = 200, description = "Admin Dashboard Stats", body = AdminStats)
    ),
    security(("cookieAuth" = []))
)]
pub async fn get_admin_stats(
    State(state): State<AppState>,
    Query(query): Query<StatsQuery>,
) -> Result<Json<AdminStats>, ApiError> {
    let pool = &state.pool;

    let days = query.days.unwrap_or(0); // 0 means ALL
    println!("DEBUG: Fetching admin stats with days filter: {}", days);

    // 1. Calculate MRR from active subscriptions (Conditional Filter)
    let mrr_data = sqlx::query!(
        r#"
        SELECT COALESCE(SUM(
            CASE 
                WHEN plan_name ILIKE '%PLATINUM%' THEN 400.00
                WHEN plan_name ILIKE '%ENTERPRISE%' THEN 260.00
                WHEN plan_name ILIKE '%GROWTH%' THEN 190.00
                ELSE 165.00
            END
        ), 0.0)::FLOAT8 as "total!" 
        FROM subscriptions 
        WHERE status = 'active' 
          AND ($1::INT = 0 OR created_at >= NOW() - (INTERVAL '1 day' * CAST($1 AS INTEGER)))
        "#,
        days
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    let total_mrr = mrr_data.total as f64;

    // 2. Count clients (Conditional Filter)
    let clients = sqlx::query!(
        r#"SELECT COUNT(*) as "count!" FROM users WHERE role::TEXT = 'CLIENT' AND ($1::INT = 0 OR created_at >= NOW() - (INTERVAL '1 day' * CAST($1 AS INTEGER)))"#, 
        days
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    // 3. Count ACTIVE projects (Conditional Filter)
    let projects = sqlx::query!(
        r#"SELECT COUNT(DISTINCT project_id) as "count!" FROM subscriptions WHERE status = 'active' AND project_id IS NOT NULL AND ($1::INT = 0 OR created_at >= NOW() - (INTERVAL '1 day' * CAST($1 AS INTEGER)))"#,
        days
    )
    .fetch_one(pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::Internal(e.to_string()))?;

    Ok(Json(AdminStats {
        total_mrr,
        total_clients: clients.count,
        active_projects: projects.count,
    }))
}

#[utoipa::path(
    get,
    path = "/api/admin/projects",
    responses(
        (status = 200, description = "List all projects across agency", body = [AdminProjectRow])
    ),
    security(("cookieAuth" = []))
)]
pub async fn list_all_projects(
    State(state): State<AppState>,
) -> Result<Json<Vec<AdminProjectRow>>, ApiError> {
    let pool = &state.pool;
    let projects = sqlx::query_as!(
        AdminProjectRow,
        r#"
        SELECT
            pr.id as id,
            pr.title as title,
            pr.description as description,
            pr.whatsapp_number as whatsapp_number,
            COALESCE(p.full_name, u.email) as "client_name!",
            u.email as "client_email!",
            COALESCE(s.plan_name, pr.selected_plan, pr.requirements->>'selected_plan') as "plan_name?",
            pr.status as "status!: ProjectStatus",
            pr.dev_url,
            pr.prod_url,
            LOWER(s.status) as "subscription_status?",
            pr.client_edit_allowed as "client_edit_allowed!",
            pr.created_at
        FROM projects pr
        JOIN users u ON pr.client_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN LATERAL (
            SELECT status, plan_name, id
            FROM subscriptions sub
            WHERE sub.project_id = pr.id 
               OR (sub.project_id IS NULL AND sub.client_id = pr.client_id)
            ORDER BY (sub.project_id = pr.id) DESC, sub.updated_at DESC
            LIMIT 1
        ) s ON TRUE
        ORDER BY pr.created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(projects))
}

#[utoipa::path(
    get,
    path = "/api/admin/projects/{id}",
    responses(
        (status = 200, description = "Get specific project details", body = Project)
    ),
    security(("cookieAuth" = []))
)]
pub async fn get_admin_project(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<Project>, ApiError> {
    let pool = &state.pool;
    let project = sqlx::query_as!(
        Project,
        r#"
        SELECT 
            p.id, p.client_id as "client_id!", p.title, p.description, p.whatsapp_number, p.requirements, p.status as "status!: _", 
            p.dev_url, p.prod_url, s.status as subscription_status, COALESCE(NULLIF(p.selected_plan, ''), s.plan_name, p.requirements->>'selected_plan') as selected_plan, p.client_edit_allowed as "client_edit_allowed!", p.created_at, p.updated_at 
        FROM projects p
        LEFT JOIN subscriptions s ON p.id = s.project_id
        WHERE p.id = $1
        "#,
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::NotFound("Project not found".to_string()))?;

    Ok(Json(project))
}

#[utoipa::path(
    patch,
    path = "/api/admin/projects/{id}",
    request_body = AdminUpdateProjectRequest,
    responses(
        (status = 200, description = "Project updated successfully")
    ),
    security(("cookieAuth" = []))
)]
pub async fn update_project_admin(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<AdminUpdateProjectRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let pool = &state.pool;
    
    println!("DEBUG Unified: Updating project {}: dev={:?}, prod={:?}, status={:?}", id, payload.dev_url, payload.prod_url, payload.status);

    sqlx::query!(
        r#"
        UPDATE projects 
        SET 
            status = COALESCE($1, status),
            dev_url = COALESCE($2, dev_url),
            prod_url = COALESCE($3, prod_url),
            updated_at = NOW()
        WHERE id = $4
        "#,
        payload.status as Option<ProjectStatus>,
        payload.dev_url as Option<String>,
        payload.prod_url as Option<String>,
        id
    )
    .execute(pool)
    .await
    .map_err(|e| {
        ApiError::Internal(e.to_string())
    })?;

    Ok(Json(serde_json::json!({"success": true, "message": "Project parameters updated"})))
}

#[utoipa::path(
    post,
    path = "/api/admin/projects/{id}/invoice",
    responses(
        (status = 200, description = "Invoice generated and project status updated")
    ),
    security(("cookieAuth" = []))
)]
pub async fn generate_project_invoice(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let pool = &state.pool;
    // 1. Transactional Update: Update Project Status & Create Billing Record
    let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    // Check if project exists and get requirements
    let project = sqlx::query!(
        "SELECT title, requirements FROM projects WHERE id = $1", 
        id
    )
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::NotFound("Project not found".to_string()))?;

    // Determine price based on plan
    let selected_plan = project.requirements
        .as_ref()
        .and_then(|r| r.get("selected_plan"))
        .and_then(|p| p.as_str())
        .unwrap_or("Standard");

    let price_str = match selected_plan.to_uppercase().as_str() {
        "GROWTH" => "190.00",
        "ENTERPRISE" => "260.00",
        "PLATINUM" => "400.00",
        _ => "165.00",
    };

    // Update Status
    sqlx::query!(
        "UPDATE projects SET status = 'PAYMENT_PENDING' WHERE id = $1",
        id
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    // Create Invoice (Setup Fee)
    sqlx::query!(
        "INSERT INTO billings (project_id, amount, status, description, due_date) 
         VALUES ($1, 
            CASE 
                WHEN $2 = '190.00' THEN 190.00
                WHEN $2 = '260.00' THEN 260.00
                WHEN $2 = '400.00' THEN 400.00
                ELSE 165.00
            END, 
            'PENDING', $3, NOW() + INTERVAL '7 days')",
        id,
        price_str,
        format!("Setup & Implementation Fee for {}", project.title)
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({
        "success": true, 
        "message": format!("Invoice generated for {} and status moved to PaymentPending", price_str)
    })))
}

#[utoipa::path(
    get,
    path = "/api/admin/clients",
    responses(
        (status = 200, description = "Client Ledger rows", body = [ClientLedgerRow])
    ),
    security(("cookieAuth" = []))
)]
pub async fn list_all_clients(
    State(state): State<AppState>,
) -> Result<Json<Vec<ClientLedgerRow>>, ApiError> {
    let pool = &state.pool;
    
    let rows = sqlx::query_as!(
        ClientLedgerRow,
        r#"
        SELECT
            u.id as id,
            COALESCE(p.full_name, u.email) as "full_name!",
            u.email as "email!",
            pr.id as "project_id?",
            pr.title as "project_title?",
            s.plan_name as "plan_name?",
            pr.status as "project_status?: ProjectStatus",
            s.id as "subscription_id?",
            LOWER(s.status) as "subscription_status?",
            (CASE 
                WHEN s.plan_name ILIKE '%PLATINUM%' THEN 400.00
                WHEN s.plan_name ILIKE '%ENTERPRISE%' THEN 260.00
                WHEN s.plan_name ILIKE '%GROWTH%' THEN 190.00
                ELSE 165.00
            END)::FLOAT8 as "amount?",
            s.created_at as "created_at?"
        FROM subscriptions s
        JOIN users u ON s.client_id = u.id
        LEFT JOIN user_profiles p ON u.id = p.user_id
        LEFT JOIN projects pr ON s.project_id = pr.id
        WHERE s.status = 'active'
          AND u.role::TEXT = 'CLIENT'
        ORDER BY s.created_at DESC
        "#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| {
        eprintln!("ADMIN_LEDGER_ERROR: SQL execution failed: {:?}", e);
        ApiError::Internal(e.to_string())
    })?;

    Ok(Json(rows))
}

#[utoipa::path(
    post,
    path = "/api/admin/subscriptions/{id}/cancel",
    responses(
        (status = 200, description = "Admin manual override cancelation success")
    ),
    security(("cookieAuth" = []))
)]
pub async fn admin_cancel_subscription(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let pool = &state.pool;
    let stripe_secret = std::env::var("STRIPE_SECRET_KEY").map_err(|_| ApiError::Internal("STRIPE_SECRET_KEY not set".into()))?;

    // 1. Fetch Subscription and Project Details
    let sub = sqlx::query!(
        "SELECT stripe_sub_id, project_id FROM subscriptions WHERE id = $1",
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::NotFound("Subscription not found".into()))?;

    // 2. Call Stripe if ID exists
    if let Some(stripe_id) = sub.stripe_sub_id {
        let client = reqwest::Client::new();
        let res = client.delete(format!("https://api.stripe.com/v1/subscriptions/{}", stripe_id))
            .header(reqwest::header::AUTHORIZATION, format!("Bearer {}", stripe_secret))
            .send().await.map_err(|e| ApiError::Internal(format!("Stripe Communication Error: {}", e)))?;

        // Even if Stripe returns 404 (already canceled), we proceed to sync local DB
        if !res.status().is_success() && res.status() != reqwest::StatusCode::NOT_FOUND {
            let error_body = res.text().await.unwrap_or_default();
            return Err(ApiError::Internal(format!("Stripe API Error: {}", error_body)));
        }
    }

    let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    // 3. Update subscription status
    sqlx::query!(
        "UPDATE subscriptions SET status = 'CANCELED_BY_ADMIN', updated_at = NOW() WHERE id = $1",
        id
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    // 4. Update project status to allow re-activation (SYNC FIX)
    if let Some(pid) = sub.project_id {
        sqlx::query!(
            "UPDATE projects SET status = 'PAYMENT_PENDING', updated_at = NOW() WHERE id = $1",
            pid
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?;
    }

    tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({"success": true, "message": "Subscription canceled and project status reset to Payment Pending."})))
}

pub async fn create_admin_user(
    State(state): State<AppState>,
    Json(payload): Json<CreateAdminRequest>,
) -> Result<Json<AuthResponse>, ApiError> {
    let pool = &state.pool;
    // 1. Check if email exists
    let existing = sqlx::query!("SELECT id FROM users WHERE email = $1", payload.email)
        .fetch_optional(pool).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    if existing.is_some() {
        return Err(ApiError::EmailExists);
    }

    // 2. Hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(payload.password.as_bytes(), &salt)
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .to_string();

    // 3. Insert user & profile in a transaction
    let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    let user_id = sqlx::query!(
        "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'ADMIN') RETURNING id",
        payload.email,
        password_hash
    ).fetch_one(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?.id;

    sqlx::query!(
        "INSERT INTO user_profiles (user_id, full_name) VALUES ($1, $2)",
        user_id,
        payload.full_name
    ).execute(&mut *tx).await.map_err(|e| ApiError::Internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(AuthResponse { message: "Admin user created successfully".to_owned() }))
}

#[utoipa::path(
    patch,
    path = "/api/admin/projects/{id}/permission",
    request_body = UpdatePermissionRequest,
    responses(
        (status = 200, description = "Project edit permission updated")
    ),
    security(("cookieAuth" = []))
)]
pub async fn update_project_permission(
    State(state): State<AppState>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<UpdatePermissionRequest>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let pool = &state.pool;
    println!("DEBUG: Updating project {} permission to {}", id, payload.allowed);
    
    let res = sqlx::query!(
        "UPDATE projects SET client_edit_allowed = $1, updated_at = NOW() WHERE id = $2",
        payload.allowed,
        id
    )
    .execute(pool)
    .await
    .map_err(|e| {
        println!("ERROR: Failed to update project permission: {}", e);
        ApiError::Internal(e.to_string())
    })?;

    if res.rows_affected() == 0 {
        return Err(ApiError::NotFound("Project not found".into()));
    }

    Ok(Json(serde_json::json!({ "status": "success", "allowed": payload.allowed })))
}
