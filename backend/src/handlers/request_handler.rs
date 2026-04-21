use axum::{
    extract::{State, Path},
    Json,
    Extension,
};
use sqlx::{PgPool, Postgres, Transaction};
use crate::AppState;
use crate::models::{requests::{Request, RequestType, RequestStatus, CreateRequest, UpdateStatusRequest}, user::UserRole};
use crate::utils::{error::ApiError, jwt::Claims};

#[utoipa::path(
    post,
    path = "/api/requests",
    request_body = CreateRequest,
    responses(
        (status = 201, description = "Request created successfully", body = Request)
    ),
    security(("cookieAuth" = []))
)]
pub async fn create_request(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateRequest>,
) -> Result<Json<Request>, ApiError> {
    let pool = &state.pool;
    // 1. Verify project ownership or status
    let project_owner = sqlx::query!("SELECT client_id as \"client_id!\" FROM projects WHERE id = $1", payload.project_id)
        .fetch_one(pool).await.map_err(|_| ApiError::NotFound("Project not found".into()))?;
    
    if project_owner.client_id != claims.sub {
        return Err(ApiError::Unauthorized);
    }

    // 2. Insert Request
    let request = sqlx::query_as!(
        Request,
        r#"
        INSERT INTO requests (project_id, created_by, type, title, description, attachment_urls)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING 
            id as "id!", 
            project_id as "project_id!", 
            created_by as "created_by!", 
            NULL::text as "creator_email",
            type as "type_!: RequestType", 
            status as "status!: RequestStatus", 
            title as "title!", 
            description as "description!", 
            attachment_urls as "attachment_urls", 
            0::bigint as "unread_count",
            created_at as "created_at!", 
            updated_at as "updated_at!"
        "#,
        payload.project_id,
        claims.sub,
        payload.type_ as RequestType,
        payload.title,
        payload.description,
        &payload.attachment_urls.unwrap_or_default()
    )
    .fetch_one(pool)
    .await
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    // 3. (REMOVED) Notify Admin - Email notifications disabled per user request
    
    Ok(Json(request))
}

#[utoipa::path(
    get,
    path = "/api/requests",
    responses(
        (status = 200, description = "List of requests", body = [Request])
    ),
    security(("cookieAuth" = []))
)]
pub async fn get_requests(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<Request>>, ApiError> {
    let pool = &state.pool;
    
    let requests = if claims.role == "ADMIN" {
        sqlx::query_as!(
            Request,
            r#"SELECT 
                r.id as "id!", 
                r.project_id as "project_id!", 
                r.created_by as "created_by!", 
                u.email as "creator_email",
                r.type as "type_!: RequestType", 
                r.status as "status!: RequestStatus", 
                r.title as "title!", 
                r.description as "description!", 
                r.attachment_urls as "attachment_urls", 
                (SELECT COUNT(*) FROM request_comments rc WHERE rc.request_id = r.id AND rc.is_read = FALSE AND rc.user_id != $1) as "unread_count",
                r.created_at as "created_at!", 
                r.updated_at as "updated_at!" 
            FROM requests r
            JOIN users u ON r.created_by = u.id
            ORDER BY r.created_at DESC"#,
            claims.sub
        )
        .fetch_all(pool).await
    } else {
        sqlx::query_as!(
            Request,
            r#"SELECT 
                r.id as "id!", 
                r.project_id as "project_id!", 
                r.created_by as "created_by!", 
                NULL::text as "creator_email",
                r.type as "type_!: RequestType", 
                r.status as "status!: RequestStatus", 
                r.title as "title!", 
                r.description as "description!", 
                r.attachment_urls as "attachment_urls", 
                (SELECT COUNT(*) FROM request_comments rc WHERE rc.request_id = r.id AND rc.is_read = FALSE AND rc.user_id != $1) as "unread_count",
                r.created_at as "created_at!", 
                r.updated_at as "updated_at!" 
            FROM requests r
            WHERE r.created_by = $1 
            ORDER BY r.created_at DESC"#,
            claims.sub
        )
        .fetch_all(pool).await
    }
    .map_err(|e| ApiError::Internal(e.to_string()))?;

    Ok(Json(requests))
}

#[utoipa::path(
    patch,
    path = "/api/requests/{id}/status",
    request_body = UpdateStatusRequest,
    responses(
        (status = 200, description = "Status updated successfully")
    ),
    security(("cookieAuth" = []))
)]
pub async fn update_request_status(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<Uuid>,
    Json(payload): Json<UpdateStatusRequest>,
) -> Result<Json<Value>, ApiError> {
    let pool = &state.pool;
    if claims.role != "ADMIN" {
        return Err(ApiError::Unauthorized);
    }

    println!(">>> TRACE: Updating ticket {} status in DB to {:?}", id, payload.status);
    sqlx::query!(
        "UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2",
        payload.status.clone() as RequestStatus,
        id
    )
    .execute(pool)
    .await
    .map_err(|e| {
        println!(">>> TRACE ERROR: DB Update failed: {}", e);
        ApiError::Internal(e.to_string())
    })?;
    println!(">>> TRACE: DB Update success for ticket {}", id);

    // NEW: Fail-Safe Redundant Signaling
    let system_msg = format!("[SYSTEM]: Ticket status updated to {:?}", payload.status);
    println!(">>> TRACE: Inserting system comment for ticket {}", id);
    let comment = sqlx::query_as!(
        crate::models::requests::RequestComment,
        r#"
        INSERT INTO request_comments (request_id, user_id, message, is_read)
        VALUES ($1, $2, $3, FALSE)
        RETURNING 
            id as "id!", 
            request_id as "request_id!", 
            user_id as "user_id!", 
            message as "message!", 
            attachment_urls, 
            is_read as "is_read!", 
            created_at as "created_at!"
        "#,
        id,
        claims.sub,
        system_msg
    )
    .fetch_one(pool)
    .await
    .map_err(|e| {
        println!(">>> TRACE ERROR: System comment insert failed: {}", e);
        ApiError::Internal(e.to_string())
    })?;
    println!(">>> TRACE: System comment inserted successfully for ticket {}", id);

    // Broadcast both events for maximum reliability
    println!(">>> TRACE: Attempting broadcast for ticket {}", id);
    
    let res1 = state.hub.tx.send(crate::utils::realtime::RealtimeEvent::NewComment {
        request_id: id,
        comment,
    });
    println!(">>> TRACE: NewComment broadcast result: {:?}", res1);

    let res2 = state.hub.tx.send(crate::utils::realtime::RealtimeEvent::TicketStatusUpdate {
        request_id: id,
        status: format!("{:?}", payload.status),
    });
    println!(">>> TRACE: TicketStatusUpdate broadcast result: {:?}", res2);

    Ok(Json(serde_json::json!({"status": "updated", "new_status": format!("{:?}", payload.status)})))
}
use serde_json::Value;
use uuid::Uuid;
