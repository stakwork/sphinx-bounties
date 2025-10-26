import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { verifyJWT, signJWT } from "./jwt";
import { AUTH_COOKIE_NAME, COOKIE_MAX_AGE } from "./constants";
import type { Session } from "@/types/auth";

export async function setSessionCookie(pubkey: string): Promise<string> {
  const token = await signJWT({ pubkey });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return token;
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  // Delete with the same options as when setting to ensure proper clearing
  cookieStore.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
    expires: new Date(0),
  });
}

export async function getSessionFromCookies(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  return {
    pubkey: payload.pubkey,
    expiresAt: new Date(payload.exp * 1000),
  };
}

export async function verifySession(request: NextRequest): Promise<Session | null> {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  return {
    pubkey: payload.pubkey,
    expiresAt: new Date(payload.exp * 1000),
  };
}
