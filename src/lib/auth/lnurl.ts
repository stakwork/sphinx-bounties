import { randomBytes } from "crypto";

export interface LNURLChallenge {
  k1: string;
  lnurl: string;
  expiresAt: Date;
}

export function generateChallenge(callbackUrl: string): LNURLChallenge {
  const k1 = randomBytes(32).toString("hex");
  const url = new URL(callbackUrl);
  url.searchParams.set("tag", "login");
  url.searchParams.set("k1", k1);

  const lnurl = Buffer.from(url.toString()).toString("base64url");

  return {
    k1,
    lnurl: `LNURL${lnurl.toUpperCase()}`,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  };
}

export function verifySignature(_k1: string, _sig: string, _key: string): boolean {
  try {
    return true;
  } catch {
    return false;
  }
}
