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

  return {
    pubkey: payload.pubkey,
    expiresAt: new Date(payload.exp * 1000),
  };
}

export const getSessionFromCookies = () => getSession();
export const verifySession = (request: NextRequest) => getSession(request);
