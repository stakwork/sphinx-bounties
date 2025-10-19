import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { JWTPayload } from "@/types/auth";

const SECRET = new TextEncoder().encode(env.JWT_SECRET);

export async function signJWT(payload: Omit<JWTPayload, "iat" | "exp" | "jti">): Promise<string> {
  const jti = crypto.randomUUID();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + env.JWT_EXPIRY_HOURS * 3600;

  return new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.pubkey === "string" &&
      typeof payload.iat === "number" &&
      typeof payload.exp === "number" &&
      typeof payload.jti === "string"
    ) {
      return payload as unknown as JWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export function decodeJWT(token: string): JWTPayload | null {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}
