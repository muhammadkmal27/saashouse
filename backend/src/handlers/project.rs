use axum::{extract::{State, Path}, Json, Extension};
use sqlx::PgPool;
use crate::AppState;
use crate::models::project::{Project, CreateProjectRequest, RequirementsPayload, ProjectStatus};
use crate::models::admin::AdminProjectRow;
use crate::utils::{error::ApiError, jwt::Claims, realtime::RealtimeEvent};

#[utoipa::path(
    get,
    path = "/api/projects",
    responses(
        (status = 200, description = "List of user's projects", body = Vec<Project>)
    ),
    security(
        ("cookieAuth" = [])
    )
)]
pub async fn list_projects(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Project>>, ApiError> {
    let pool = &state.pool;
    let projects = sqlx::query_as!(
        Project,
        r#"
        SELECT 
            p.id, p.client_id as "client_id!", p.title, p.description, p.whatsapp_number, p.requirements, p.status as "status!: _", 
            p.dev_url, p.prod_url, s.status as subscription_status, COALESCE(NULLIF(p.selected_plan, ''), s.plan_name, p.requirements->>'selected_plan') as selected_plan, p.client_edit_allowed as "client_edit_allowed!", p.created_at, p.updated_at
        FROM projects p
        LEFT JOIN LATERAL (
            SELECT status, plan_name
            FROM subscriptions sub
            WHERE sub.project_id = p.id
            ORDER BY sub.updated_at DESC
            LIMIT 1
        ) s ON TRUE
        WHERE p.client_id = $1
        ORDER BY p.created_at DESC
        "#,
        claims.sub
    )
    .fetch_all(pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::Internal(e.to_string()))?;

    Ok(Json(projects))
}

#[utoipa::path(
    get,
    path = "/api/projects/{id}",
    responses(
        (status = 200, description = "Get project details", body = Project)
    ),
    security(
        ("cookieAuth" = [])
    )
)]
pub async fn get_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
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
        LEFT JOIN LATERAL (
            SELECT status, plan_name
            FROM subscriptions sub
            WHERE sub.project_id = p.id
            ORDER BY sub.updated_at DESC
            LIMIT 1
        ) s ON TRUE
        WHERE p.id = $1 AND p.client_id = $2
        "#,
        id,
        claims.sub
    )
    .fetch_optional(pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::NotFound("Project not found".to_string()))?;

    Ok(Json(project))
}

use validator::Validate;

#[utoipa::path(
    post,
    path = "/api/projects",
    request_body = CreateProjectRequest,
    responses(
        (status = 201, description = "Project created successfully", body = Project)
    ),
    security(
        ("cookieAuth" = [])
    )
)]
pub async fn create_project(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateProjectRequest>,
) -> Result<Json<Project>, ApiError> {
    // 0. Strict Input Validation (Rule 1)
    payload.validate().map_err(ApiError::Validation)?;

    let pool = &state.pool;
    println!("DEBUG: Received create_project request from client: {}", claims.sub);
    println!("DEBUG: Payload: {:?}", payload);
    let req_json = serde_json::to_value(&payload.requirements)
        .map_err(|e| ApiError::Internal(format!("Failed to serialize requirements: {}", e)))?;

    let project = sqlx::query_as!(
        Project,
        r#"
        INSERT INTO projects (client_id, title, description, whatsapp_number, requirements, selected_plan, status)
        VALUES ($1, $2, $3, $4, $5, $6, 'REVIEW')
        RETURNING id, client_id as "client_id!", title, description, whatsapp_number, requirements, status as "status!: _", 
                  dev_url, prod_url, NULL::TEXT as subscription_status, selected_plan, client_edit_allowed as "client_edit_allowed!", created_at, updated_at
        "#,
        claims.sub,
        payload.title,
        payload.description,
        payload.whatsapp_number,
        req_json,
        payload.selected_plan
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;
    
    // Broadcast for Admin Real-time Dashboard
    let admin_view = sqlx::query_as!(
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
        WHERE pr.id = $1
        "#,
        project.id
    )
    .fetch_one(pool)
    .await;

    if let Ok(row) = admin_view {
        let _ = state.hub.tx.send(RealtimeEvent::NewProject { project: row });
    }

    Ok(Json(project))
}

#[utoipa::path(
    patch,
    path = "/api/projects/{id}/requirements",
    request_body = RequirementsPayload,
    responses(
        (status = 200, description = "Project requirements updated successfully", body = Project)
    ),
    security(
        ("cookieAuth" = [])
    )
)]
pub async fn update_project_requirements(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<uuid::Uuid>,
    Json(payload): Json<RequirementsPayload>,
) -> Result<Json<Project>, ApiError> {
    let pool = &state.pool;
    println!("DEBUG: Updating project {} requirements from client {}", id, claims.sub);
    println!("DEBUG: Payload: {:?}", payload);

    // 1. Verify ownership AND permission
    let existing = sqlx::query!(
        r#"SELECT client_id as "client_id!", client_edit_allowed as "client_edit_allowed!" FROM projects WHERE id = $1"#, 
        id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?
    .ok_or(ApiError::NotFound("Project not found".into()))?;

    if existing.client_id != claims.sub {
        return Err(ApiError::Unauthorized);
    }
    
    if !existing.client_edit_allowed {
        return Err(ApiError::Forbidden("Blueprint update is locked by administration. Please request an unlock.".into()));
    }

    // 2. Perform update
    let req_json = serde_json::to_value(&payload)
        .map_err(|e| ApiError::Internal(format!("Failed to serialize requirements: {}", e)))?;

    let project = sqlx::query_as!(
        Project,
        r#"
        UPDATE projects 
        SET 
            selected_plan = COALESCE(NULLIF(selected_plan, ''), $1::jsonb->>'selected_plan', requirements->>'selected_plan'),
            requirements = $1::jsonb - CAST('selected_plan' AS TEXT), 
            updated_at = NOW() 
        WHERE id = $2
        RETURNING 
            id, 
            COALESCE(client_id, '00000000-0000-0000-0000-000000000000'::uuid) as "client_id!", 
            title, 
            description, 
            whatsapp_number, 
            requirements, 
            COALESCE(status, 'DRAFT'::project_status) as "status!: _", 
            dev_url, 
            prod_url, 
            NULL::TEXT as subscription_status, 
            selected_plan, 
            COALESCE(client_edit_allowed, FALSE) as "client_edit_allowed!", 
            created_at, 
            updated_at
        "#,
        req_json,
        id
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(project))
}
