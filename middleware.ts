import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/session";
import {
  isPublicRoute,
  isAuthRoute,
  requiresAuth,
  requiresWorkspaceAccess,
  requiresSuperAdmin,
} from "@/lib/auth/middleware-utils";
import { AUTH_HEADER_NAME, WORKSPACE_HEADER_NAME } from "@/lib/auth/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  response.headers.set("x-request-id", crypto.randomUUID());

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

  if (await requiresSuperAdmin(pathname, session)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  const workspaceCheck = await requiresWorkspaceAccess(pathname, session);
  if (workspaceCheck.required && !workspaceCheck.allowed) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (workspaceCheck.workspaceId) {
    response.headers.set(WORKSPACE_HEADER_NAME, workspaceCheck.workspaceId);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sphinx_icon.png).*)"],
};
