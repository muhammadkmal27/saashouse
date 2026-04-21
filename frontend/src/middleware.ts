import { NextRequest, NextResponse } from "next/server";
import { decodeJwt } from "jose";

// Routes that are ALWAYS accessible (even in maintenance mode)
const MAINTENANCE_BYPASS = [
  "/maintenance",
  "/auth/login",
  "/auth/verify-2fa",
  "/api/",
];

// Check if the path should bypass maintenance mode
function bypassesMaintenance(pathname: string): boolean {
  return MAINTENANCE_BYPASS.some((p) => pathname.startsWith(p));
}

// Public-facing routes that should be blocked in maintenance mode
function isPublicRoute(pathname: string): boolean {
  const publicPrefixes = ["/", "/showcase", "/pricing", "/contact", "/auth/register"];
  return publicPrefixes.some((p) =>
    pathname === p || (p !== "/" && pathname.startsWith(p))
  );
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // ─── Maintenance Mode Check ───────────────────────────────────────────────
  // Only check public routes — admin and app routes are handled by auth check below
  if (isPublicRoute(pathname) && !bypassesMaintenance(pathname)) {
    try {
      const statusRes = await fetch("http://localhost:8080/api/status", {
        // Short timeout — if backend is down, don't block users
        signal: AbortSignal.timeout(2000),
      });

      if (statusRes.ok) {
        const data = await statusRes.json();
        if (data.maintenance_mode === true) {
          // Allow admins through even on public routes
          if (token) {
            try {
              const payload = decodeJwt(token) as { role: string };
              if (payload.role === "ADMIN") {
                // Admin can see the site even in maintenance
              } else {
                return NextResponse.redirect(new URL("/maintenance", request.url));
              }
            } catch {
              return NextResponse.redirect(new URL("/maintenance", request.url));
            }
          } else {
            return NextResponse.redirect(new URL("/maintenance", request.url));
          }
        }
      }
    } catch {
      // If backend unreachable, let request through (fail-open for public routes)
    }
  }

  // ─── Auth & Role Checks ──────────────────────────────────────────────────

  // 1. No token — block protected areas
  if (!token) {
    if (pathname.startsWith("/admin") || pathname.startsWith("/app")) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    return NextResponse.next();
  }

  try {
    const payload = decodeJwt(token) as { role: string; is_2fa_verified: boolean };

    // 2. Redirect logged-in users away from login page
    if (pathname.startsWith("/auth/login")) {
      if (payload.role === "ADMIN") {
        return payload.is_2fa_verified
          ? NextResponse.redirect(new URL("/admin/dashboard", request.url))
          : NextResponse.redirect(new URL("/auth/verify-2fa", request.url));
      }
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }

    // 3. Admin route guard
    if (pathname.startsWith("/admin")) {
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/app/dashboard", request.url));
      }
      if (!payload.is_2fa_verified) {
        return NextResponse.redirect(new URL("/auth/verify-2fa", request.url));
      }
    }

    // 4. Prevent re-entry to 2FA page if already verified
    if (pathname.startsWith("/auth/verify-2fa") && payload.is_2fa_verified) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // 5. Admins should not see client portal
    if (pathname.startsWith("/app") && payload.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // 6. Also redirect clients in /app away during maintenance
    if (pathname.startsWith("/app")) {
      try {
        const statusRes = await fetch("http://localhost:8080/api/status", {
          signal: AbortSignal.timeout(2000),
        });
        if (statusRes.ok) {
          const data = await statusRes.json();
          if (data.maintenance_mode === true && payload.role !== "ADMIN") {
            return NextResponse.redirect(new URL("/maintenance", request.url));
          }
        }
      } catch {
        // fail-open
      }
    }
  } catch {
    // Corrupt token — clear it and redirect to login
    const response = NextResponse.redirect(new URL("/auth/login", request.url));
    response.cookies.delete("auth_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // All routes except Next.js internals and static files
    "/((?!_next/static|_next/image|favicon.ico|uploads/).*)",
  ],
};
