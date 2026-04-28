use axum::{extract::{State, Path}, Json};
use crate::AppState;
use crate::models::admin::{AdminUpdateProjectRequest, AdminProjectRow, UpdatePermissionRequest};
use crate::models::project::{Project, ProjectStatus};
use crate::utils::error::ApiError;
use crate::utils::realtime::RealtimeEvent;
use validator::Validate;

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

    // Real-time Update: Broadcast to client
    let updated = sqlx::query!(
        "SELECT status as \"status!: ProjectStatus\", dev_url, prod_url FROM projects WHERE id = $1",
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    let _ = state.hub.tx.send(RealtimeEvent::ProjectDataUpdate {
        project_id: id,
        status: updated.status,
        dev_url: updated.dev_url,
        prod_url: updated.prod_url,
    });

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
    // RULE 14: Use FOR UPDATE to prevent race conditions during invoice generation
    let mut tx = pool.begin().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    // Check if project exists and get requirements WITH LOCK
    let project = sqlx::query!(
        "SELECT title, requirements FROM projects WHERE id = $1 FOR UPDATE", 
        id
    )
    .fetch_optional(&mut *tx)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::NotFound("Project not found".to_string()))?;

    // Fetch prices from settings
    let prices = crate::handlers::settings::get_setting_value(pool, "package_prices").await;
    let default_prices = serde_json::json!({
        "Standard": "165",
        "Growth": "240",
        "Enterprise": "410",
        "Platinum": "750"
    });
    let prices = prices.unwrap_or(default_prices);

    // Determine price based on plan
    let selected_plan = project.requirements
        .as_ref()
        .and_then(|r| r.get("selected_plan"))
        .and_then(|p| p.as_str())
        .unwrap_or("Standard");

    let price_val = match selected_plan.to_uppercase().as_str() {
        "GROWTH" => prices.get("Growth"),
        "ENTERPRISE" => prices.get("Enterprise"),
        "PLATINUM" => prices.get("Platinum"),
        _ => prices.get("Standard"),
    };

    let price_f64 = price_val
        .and_then(|v| {
            if v.is_string() {
                v.as_str().and_then(|s| s.parse::<f64>().ok())
            } else {
                v.as_f64()
            }
        })
        .unwrap_or(165.0);
    let price_bd = bigdecimal::BigDecimal::try_from(price_f64).unwrap_or_else(|_| bigdecimal::BigDecimal::from(165));

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
         VALUES ($1, $2, 'PENDING', $3, NOW() + INTERVAL '7 days')",
        id,
        price_bd,
        format!("Setup & Implementation Fee for {}", project.title)
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    tx.commit().await.map_err(|e| ApiError::Internal(e.to_string()))?;

    // Real-time Update: Broadcast to client
    let updated = sqlx::query!(
        "SELECT status as \"status!: ProjectStatus\", dev_url, prod_url FROM projects WHERE id = $1",
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    let _ = state.hub.tx.send(RealtimeEvent::ProjectDataUpdate {
        project_id: id,
        status: updated.status,
        dev_url: updated.dev_url,
        prod_url: updated.prod_url,
    });

    Ok(Json(serde_json::json!({
        "success": true, 
        "message": format!("Invoice generated for RM {} and status moved to PaymentPending", price_f64)
    })))
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
    
    let res = sqlx::query!(
        "UPDATE projects SET client_edit_allowed = $1, updated_at = NOW() WHERE id = $2",
        payload.allowed,
        id
    )
    .execute(pool)
    .await
    .map_err(|e| {
        ApiError::Internal(e.to_string())
    })?;

    if res.rows_affected() == 0 {
        return Err(ApiError::NotFound("Project not found".into()));
    }

    // Real-time Update: Broadcast to client
    let _ = state.hub.tx.send(RealtimeEvent::ProjectPermissionUpdate { 
        project_id: id, 
        allowed: payload.allowed 
    });

    Ok(Json(serde_json::json!({ "status": "success", "allowed": payload.allowed })))
}
