import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyJWT, signJWT } from "./jwt";
import { AUTH_COOKIE_NAME, COOKIE_MAX_AGE, SESSION_REFRESH_THRESHOLD } from "./constants";
import type { Session } from "@/types/auth";

export async function setSessionCookie(pubkey: string, request?: NextRequest): Promise<string> {
  const token = await signJWT({ pubkey });

  const cookieStore = await cookies();

  const isNgrok = request?.headers.get("host")?.includes("ngrok") || false;
  const isProduction = process.env.NODE_ENV === "production";
  const needsCrossSiteCookies = isNgrok || isProduction;

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: needsCrossSiteCookies,
    sameSite: needsCrossSiteCookies ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return token;
}

export async function getSession(request?: NextRequest): Promise<Session | null> {
  let token: string | undefined;

  if (request) {
    token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  }

  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  const session: Session = {
    pubkey: payload.pubkey,
    expiresAt: new Date(payload.exp * 1000),
  };

  if (shouldRefreshToken(session.expiresAt)) {
    try {
      await refreshSessionCookie(session.pubkey, request);
    } catch (error) {
      void error;
    }
  }

  return session;
}

function shouldRefreshToken(expiresAt: Date): boolean {
  const now = Date.now();
  const expiryTime = expiresAt.getTime();
  const timeUntilExpiry = (expiryTime - now) / 1000;
  return timeUntilExpiry < SESSION_REFRESH_THRESHOLD && timeUntilExpiry > 0;
}

export async function refreshSessionCookie(pubkey: string, request?: NextRequest): Promise<string> {
  return setSessionCookie(pubkey, request);
}

export const getSessionFromCookies = () => getSession();
export const verifySession = (request: NextRequest) => getSession(request);
