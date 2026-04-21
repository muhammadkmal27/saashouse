import { NextResponse } from "next/server";

// This is a Next.js Route Handler that acts as a proxy to the backend /api/status
// endpoint. Client-side components should call this endpoint instead of the backend
// directly to avoid CORS issues.
export async function GET() {
  try {
    const res = await fetch("http://localhost:8080/api/status", {
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return NextResponse.json({ maintenance_mode: false, status: "ok" });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    // If backend is unreachable, assume site is not in maintenance
    return NextResponse.json({ maintenance_mode: false, status: "ok" });
  }
}
