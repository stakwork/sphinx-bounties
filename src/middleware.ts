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

  if (isAuthRoute(pathname)) {
    return response;
  }

  const session = await verifySession(request);

  if (isPublicRoute(pathname)) {
    if (session) {
      response.headers.set(AUTH_HEADER_NAME, session.pubkey);
    }
    return response;
  }

  if (requiresAuth(pathname) && !session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session) {
    response.headers.set(AUTH_HEADER_NAME, session.pubkey);
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
