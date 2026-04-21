use axum::{
    extract::{State, Path, ws::{WebSocket, WebSocketUpgrade, Message}},
    response::Response,
    Json,
    Extension,
};
use uuid::Uuid;
use serde_json::Value;
use futures_util::{SinkExt, StreamExt};
use crate::AppState;
use crate::models::requests::{RequestComment, CreateCommentRequest};
use crate::utils::{error::ApiError, jwt::Claims, realtime::RealtimeEvent};

#[utoipa::path(
    post,
    path = "/api/requests/{id}/comments",
    request_body = CreateCommentRequest,
    responses(
        (status = 201, description = "Comment added successfully", body = RequestComment)
    ),
    security(("cookieAuth" = []))
)]
pub async fn create_comment(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(request_id): Path<Uuid>,
    Json(payload): Json<CreateCommentRequest>,
) -> Result<Json<RequestComment>, ApiError> {
    let pool = &state.pool;
    // 1. Verify access to the request
    let request = sqlx::query!("SELECT created_by as \"created_by!\", title as \"title!\" FROM requests WHERE id = $1", request_id)
        .fetch_one(pool).await.map_err(|_| ApiError::NotFound("Ticket not found".into()))?;

    if claims.role != "ADMIN" && request.created_by != claims.sub {
        return Err(ApiError::Unauthorized);
    }

    // 2. Insert Comment
    let comment = sqlx::query_as!(
        RequestComment,
        r#"
        INSERT INTO request_comments (request_id, user_id, message, attachment_urls, is_read)
        VALUES ($1, $2, $3, $4, FALSE)
        RETURNING 
            id as "id!", 
            request_id as "request_id!", 
            user_id as "user_id!", 
            message as "message!", 
            attachment_urls, 
            is_read as "is_read!",
            created_at as "created_at!"
        "#,
        request_id,
        claims.sub,
        payload.message,
        &payload.attachment_urls.unwrap_or_default()
    )
    .fetch_one(pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::Internal(e.to_string()))?;

    // 2.5 Broadcast to Hub
    let _ = state.hub.tx.send(RealtimeEvent::NewComment { 
        request_id, 
        comment: comment.clone() 
    });

    // 3. (REMOVED) Notify the other party - Email notifications disabled per user request

    Ok(Json(comment))
}

#[utoipa::path(
    get,
    path = "/api/requests/{id}/comments",
    responses(
        (status = 200, description = "List of comments", body = [RequestComment])
    ),
    security(("cookieAuth" = []))
)]
pub async fn get_comments(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(request_id): Path<Uuid>,
) -> Result<Json<Vec<RequestComment>>, ApiError> {
    let pool = &state.pool;
    // 1. Verify access
    let request = sqlx::query!("SELECT created_by as \"created_by!\" FROM requests WHERE id = $1", request_id)
        .fetch_one(pool).await.map_err(|_| ApiError::NotFound("Ticket not found".into()))?;

    if claims.role != "ADMIN" && request.created_by != claims.sub {
        return Err(ApiError::Unauthorized);
    }

    // 2. Fetch comments
    let comments = sqlx::query_as!(
        RequestComment,
        r#"SELECT 
            id as "id!", 
            request_id as "request_id!", 
            user_id as "user_id!", 
            message as "message!", 
            attachment_urls, 
            is_read as "is_read!",
            created_at as "created_at!" 
        FROM request_comments 
        WHERE request_id = $1 
        ORDER BY created_at ASC"#,
        request_id
    )
    .fetch_all(pool).await
    .map_err(|e: sqlx::Error| ApiError::Internal(e.to_string()))?;

    Ok(Json(comments))
}

pub async fn mark_as_read(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
    Path(request_id): Path<Uuid>,
) -> Result<Json<Value>, ApiError> {
    sqlx::query!(
        "UPDATE request_comments SET is_read = TRUE WHERE request_id = $1 AND user_id != $2",
        request_id,
        claims.sub
    )
    .execute(&state.pool)
    .await
    .map_err(|e: sqlx::Error| ApiError::Internal(e.to_string()))?;

    // Omega-Sync: Broadcast Read Pulse
    let _ = state.hub.tx.send(RealtimeEvent::ReadSync { request_id });

    Ok(Json(serde_json::json!({"status": "read"})))
}
#[utoipa::path(
    get,
    path = "/api/comments/unread",
    responses(
        (status = 200, description = "Unread comments count")
    ),
    security(("cookieAuth" = []))
)]
pub async fn get_unread_count(
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Value>, ApiError> {
    let pool = &state.pool;
    let count = if claims.role == "ADMIN" {
        sqlx::query!(
            "SELECT COUNT(*) as count FROM request_comments WHERE is_read = FALSE AND user_id != $1",
            claims.sub
        )
        .fetch_one(pool).await.map(|r| r.count)
    } else {
        sqlx::query!(
            "SELECT COUNT(c.*) as count FROM request_comments c
             JOIN requests r ON c.request_id = r.id
             WHERE c.is_read = FALSE AND c.user_id != $1 AND r.created_by = $2",
            claims.sub, claims.sub
        )
        .fetch_one(pool).await.map(|r| r.count)
    }.map_err(|e: sqlx::Error| ApiError::Internal(e.to_string()))?;

    Ok(Json(serde_json::json!({"count": count.unwrap_or(0)})))
}

pub async fn ws_handler(

    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Extension(claims): Extension<Claims>,
) -> Response {
    ws.on_upgrade(move |socket| handle_socket(socket, state, claims))
}

async fn handle_socket(socket: WebSocket, state: AppState, claims: Claims) {
    let (mut sender, mut receiver) = socket.split();
    let mut rx = state.hub.tx.subscribe();

    // Task A: Broadcaster (Hub -> Socket)
    let send_task = async {
        loop {
            match rx.recv().await {
                Ok(event) => {
                    println!(">>> TRACE: HUB RECEIVED EVENT: {:?}", event);
                    // Filter: Admin sees everything. Client sees only their ticket updates.
                    let should_send = if claims.role == "ADMIN" {
                        println!(">>> TRACE: ADMIN BYPASS - sending to {}", claims.sub);
                        true
                    } else {
                        match &event {
                            RealtimeEvent::NewComment { request_id, .. } => {
                                let res = sqlx::query!("SELECT created_by FROM requests WHERE id = $1", request_id)
                                    .fetch_one(&state.pool).await;
                                match res {
                                    Ok(r) => {
                                        let is_owner = r.created_by == Some(claims.sub);
                                        println!("WS FILTER: Ticket {} belongs to {:?}. Socket user is {}. Match: {}", request_id, r.created_by, claims.sub, is_owner);
                                        is_owner
                                    },
                                    Err(e) => {
                                        println!("WS FILTER ERROR: Could not find ticket {}: {}", request_id, e);
                                        false
                                    },
                                }
                            },
                             RealtimeEvent::ReadSync { request_id } | RealtimeEvent::StatusPulse { request_id } => {
                                let res = sqlx::query!("SELECT created_by FROM requests WHERE id = $1", request_id)
                                    .fetch_one(&state.pool).await;
                                match res {
                                    Ok(r) => r.created_by == Some(claims.sub),
                                    Err(_) => false,
                                }
                             },
                             RealtimeEvent::TicketStatusUpdate { .. } => true, 
                             RealtimeEvent::Ping => true,
                        }
                    };

                    if should_send {
                        if let Ok(msg) = serde_json::to_string(&event) {
                            if sender.send(Message::Text(msg)).await.is_err() {
                                break;
                            }
                        }
                    }
                },
                Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                Err(tokio::sync::broadcast::error::RecvError::Closed) => break,
            }
        }
    };

    // Task B: Receiver (Socket -> Hub)
    let recv_task = async {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&text) {
                    if parsed["type"] == "StatusPulse" {
                        if let Some(req_id_str) = parsed["request_id"].as_str() {
                            if let Ok(req_id) = uuid::Uuid::parse_str(req_id_str) {
                                println!(">>> TRACE: RECEIVED PULSE FROM AGENT {}: {}", claims.sub, req_id);
                                let _ = state.hub.tx.send(RealtimeEvent::StatusPulse { request_id: req_id });
                            }
                        }
                    }
                }
            }
        }
    };

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }
}
