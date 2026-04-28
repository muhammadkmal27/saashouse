use axum::{
    http::{Request, Response, header::{X_CONTENT_TYPE_OPTIONS, CONTENT_SECURITY_POLICY, STRICT_TRANSPORT_SECURITY}},
    middleware::Next,
    body::Body,
};

pub async fn security_headers_middleware(req: Request<Body>, next: Next) -> Response<Body> {
    let mut response = next.run(req).await;
    
    let headers = response.headers_mut();
    
    // Rule 23: Security Headers & CSP
    headers.insert(X_CONTENT_TYPE_OPTIONS, "nosniff".parse().unwrap());
    headers.insert(STRICT_TRANSPORT_SECURITY, "max-age=31536000; includeSubDomains".parse().unwrap());
    headers.insert(axum::http::header::X_FRAME_OPTIONS, "DENY".parse().unwrap());
    
    // Hardened CSP
    let csp = "default-src 'self'; \
               script-src 'self' https://js.stripe.com; \
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; \
               font-src 'self' https://fonts.gstatic.com; \
               img-src 'self' data:; \
               connect-src 'self' https://api.stripe.com; \
               frame-ancestors 'none'; \
               base-uri 'self'; \
               form-action 'self';";
    
    headers.insert(CONTENT_SECURITY_POLICY, csp.parse().unwrap());
    
    response
}
