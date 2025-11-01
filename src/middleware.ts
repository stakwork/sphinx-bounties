import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session";
import {
  isPublicRoute,
  isAuthRoute,
  requiresAuth,
  requiresSuperAdmin,
  extractWorkspaceId,
} from "@/lib/auth/middleware-utils";
import { AUTH_HEADER_NAME, WORKSPACE_HEADER_NAME } from "@/lib/auth/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.warn("[Middleware] START - Path:", pathname);

  const response = NextResponse.next();

  response.headers.set("x-request-id", crypto.randomUUID());

  const isVerifyGate = pathname === "/api/auth/verify-gate";
  const isNextAsset = pathname.startsWith("/_next");
  const isFavicon = pathname.startsWith("/favicon");
  const isSphinxIcon = pathname.startsWith("/sphinx_icon");

  if (isVerifyGate || isNextAsset || isFavicon || isSphinxIcon) {
    return response;
  }

  const hasGateAccess = request.cookies.has("gate-access");

  if (!hasGateAccess) {
    if (pathname === "/") {
      response.headers.set("x-gate-required", "true");
      return response;
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  console.warn("[Middleware] Processing path:", pathname);
  console.warn("[Middleware] Is auth route?", isAuthRoute(pathname));

  if (isAuthRoute(pathname)) {
    console.warn("[Middleware] Auth route detected, skipping session check");
    return response;
  }

  const session = await verifySession(request);

  console.warn("[Middleware]", {
    pathname,
    hasSession: !!session,
    sessionPubkey: session?.pubkey?.substring(0, 10),
    isPublic: isPublicRoute(pathname),
    requiresAuth: requiresAuth(pathname),
  });

  if (isPublicRoute(pathname)) {
    if (session) {
      console.warn("[Middleware] Public route with session, setting header");
      response.headers.set(AUTH_HEADER_NAME, session.pubkey);
    } else {
      console.warn("[Middleware] Public route, no session");
    }
    return response;
  }

  if (requiresAuth(pathname) && !session) {
    console.warn("[Middleware] Protected route without session, redirecting to login");
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    console.warn("[Middleware] Setting auth header for authenticated request");
    response.headers.set(AUTH_HEADER_NAME, session.pubkey);
  } else {
    console.warn("[Middleware] No session for non-public route");
  }

  if (requiresSuperAdmin(pathname, session)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  const workspaceId = extractWorkspaceId(pathname);
  if (workspaceId) {
    response.headers.set(WORKSPACE_HEADER_NAME, workspaceId);
  }

  return response;
}

// Simple matcher - match ALL routes to test if middleware works at all
export const config = {
  matcher: [
    "/api/:path*",
    "/workspaces/:path*",
    "/bounties/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
  ],
};
