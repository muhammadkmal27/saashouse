use axum::{middleware, routing::{get, post, patch}, Router, extract::DefaultBodyLimit};
use axum::http::{Method, header::{ACCEPT, AUTHORIZATION, CONTENT_TYPE}};
use tower_http::cors::CorsLayer;
use tower_http::services::ServeDir;
use tower_http::limit::RequestBodyLimitLayer;
// use tower_governor::GovernorLayer;
use crate::utils::rate_limit::rate_limit_middleware;
use crate::utils::headers::security_headers_middleware;
use utoipa::OpenApi;
use utoipa_swagger_ui::SwaggerUi;
use crate::handlers::{auth, project, billing, admin, webhooks, assets, tools, profile, request_handler, comment_handler, settings, toyyibpay, agreement};
use crate::handlers::auth::google;
use crate::models::{
    auth::{LoginRequest, RegisterRequest, AuthResponse, Verify2FARequest}, 
    user::{User, UserRole},
    project::{Project, ProjectStatus, CreateProjectRequest},
    billing::{Subscription, AutoRenewRequest},
    admin::{AdminStats, AdminUpdateProjectRequest, ClientLedgerRow, UpdatePermissionRequest},
    requests::{Request, RequestType, RequestStatus, CreateRequest, RequestComment, CreateCommentRequest, UpdateStatusRequest as TicketUpdateStatusRequest},
    agreement::{ServiceAgreement, SignAgreementRequest}
};
use crate::utils::auth_middleware::require_auth;

#[derive(OpenApi)]
#[openapi(
    paths(
        auth::register,
        auth::login,
        auth::logout,
        auth::verify_2fa,
        project::list_projects,
        project::get_project,
        project::create_project,
        project::update_project_requirements,
        billing::create_subscription_session,
        billing::get_subscription,
        billing::toggle_auto_renew,
        admin::get_admin_stats,
        admin::list_all_projects,
        admin::update_project_admin,
        admin::generate_project_invoice,
        admin::admin_cancel_subscription,
        admin::list_all_clients,
        request_handler::create_request,
        request_handler::get_requests,
        request_handler::update_request_status,
        comment_handler::create_comment,
        comment_handler::get_comments,
        auth::password_reset::forgot_password,
        auth::password_reset::reset_password,
        agreement::get_agreement,
        agreement::sign_agreement
    ),
    components(
        schemas(
            LoginRequest, RegisterRequest, AuthResponse, Verify2FARequest, User, UserRole,
            Project, ProjectStatus, CreateProjectRequest,
            Subscription, AutoRenewRequest, AdminStats, AdminUpdateProjectRequest, ClientLedgerRow, UpdatePermissionRequest,
            Request, RequestType, RequestStatus, CreateRequest, RequestComment, CreateCommentRequest, TicketUpdateStatusRequest,
            ServiceAgreement, SignAgreementRequest
        )
    ),
    tags(
        (name = "Auth", description = "Authentication logic API endpoints."),
        (name = "Project", description = "Project resource endpoints."),
        (name = "Billing", description = "Billing and subscription engine."),
        (name = "Admin", description = "Agency internal administration.")
    )
)]
pub struct ApiDoc;

use crate::AppState;

pub fn create_router(state: AppState) -> Router {
    // Dynamic CORS origins from env
    let default_origins = "http://localhost:3000,http://100.105.77.107:3000".to_string();
    let env_origins = std::env::var("ALLOWED_ORIGINS").unwrap_or(default_origins);
    let origins: Vec<axum::http::HeaderValue> = env_origins
        .split(',')
        .map(|s| s.trim().parse::<axum::http::HeaderValue>().unwrap())
        .collect();

    let cors = CorsLayer::new()
        .allow_origin(origins)
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::PATCH])
        .allow_headers([ACCEPT, AUTHORIZATION, CONTENT_TYPE, axum::http::HeaderName::from_static("x-csrf-token")])
        .allow_credentials(true);

    let protected_routes = Router::new()
        .route("/projects", get(project::list_projects).post(project::create_project))
        .route("/projects/:id", get(project::get_project))
        .route("/projects/:id/requirements", patch(project::update_project_requirements))
        .route("/projects/:id/agreement", get(agreement::get_agreement).post(agreement::sign_agreement))
        .route("/assets/upload", post(assets::upload_asset))
        .route("/tools/whois", get(tools::check_whois))
        .route("/tools/domain-check", get(tools::check_domain_availability))
        .route("/me", get(profile::get_my_profile).patch(profile::update_my_profile))
        .route("/me/preferences", get(profile::get_preferences).patch(profile::update_preferences))
        .route("/auth/password", patch(profile::update_password))
        .route("/billing/subscription", get(billing::get_subscription))
        .route("/billing/checkout", post(billing::create_subscription_session))
        .route("/billing/projects/:id/auto-renew", post(billing::toggle_auto_renew))
        .route("/billing/toyyibpay/checkout", post(toyyibpay::create_toyyibpay_bill))
        .route("/requests", get(request_handler::get_requests).post(request_handler::create_request))
        .route("/requests/:id/comments", get(comment_handler::get_comments).post(comment_handler::create_comment))
        .route("/requests/:id/comments/read", patch(comment_handler::mark_as_read))
        .route("/comments/unread", get(comment_handler::get_unread_count))
        .route("/ws/ticket", post(comment_handler::get_ws_ticket))
        .layer(middleware::from_fn(require_auth));

    let admin_routes = Router::new()
        .route("/stats", get(admin::get_admin_stats))
        .route("/projects", get(admin::list_all_projects))
        .route("/projects/:id", get(admin::get_admin_project).patch(admin::update_project_admin))
        .route("/projects/:id/permission", patch(admin::update_project_permission))
        .route("/projects/:id/invoice", post(admin::generate_project_invoice))
        .route("/users", post(admin::create_admin_user))
        .route("/clients", get(admin::list_all_clients))
        .route("/subscription/:id/cancel", post(admin::admin_cancel_subscription))
        .route("/requests/:id/status", patch(request_handler::update_request_status))
        .route("/settings", get(settings::get_all_settings))
        .route("/settings/:key", patch(settings::update_setting))
        .layer(middleware::from_fn(crate::utils::admin_middleware::require_admin))
        .layer(middleware::from_fn(require_auth));

    let api_router = Router::new()
        .nest("/admin", admin_routes)
        .merge(protected_routes)
        .layer(middleware::from_fn_with_state(state.clone(), crate::utils::csrf::csrf_middleware));

    let swagger_router = Router::new()
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()))
        .layer(middleware::from_fn(crate::utils::admin_middleware::require_admin))
        .layer(middleware::from_fn(require_auth));

    Router::new()
        .merge(swagger_router)
        .route("/api/auth/register", post(auth::register))
        .route("/api/auth/login", post(auth::login))
        .route("/api/auth/logout", post(auth::logout))
        .route("/api/auth/verify-2fa", post(auth::verify_2fa))
        .route("/api/auth/resend-otp", post(auth::resend_otp))
        .route("/api/auth/google/login", get(google::google_login_redirect))
        .route("/api/auth/google/callback", get(google::google_callback))
        .route("/api/webhooks/stripe", post(webhooks::handle_stripe_webhook))
        .route("/api/billing/toyyibpay-callback", post(toyyibpay::toyyibpay_callback))
        .route("/api/billing/toyyibpay/verify", get(toyyibpay::verify_payment))
        .route("/api/contact", post(tools::submit_contact_form))
        .route("/api/auth/forgot-password", post(auth::password_reset::forgot_password))
        .route("/api/auth/reset-password", post(auth::password_reset::reset_password))
        .route("/api/ws", get(comment_handler::ws_handler))
        // Public status and prices endpoints (no auth required)
        .route("/api/status", get(settings::get_public_status))
        .route("/api/prices", get(settings::get_public_prices))
        .nest("/api", api_router)
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(cors)
        .layer(middleware::from_fn(security_headers_middleware))
        .layer(middleware::from_fn_with_state(state.clone(), rate_limit_middleware))
        .layer(DefaultBodyLimit::disable())
        .layer(RequestBodyLimitLayer::new(10 * 1024 * 1024)) // 10MB limit
        .with_state(state)
}
