import crypto from "crypto";
import * as secp from "@noble/secp256k1";
import { logError } from "@/lib/errors/logger";

export interface LNURLChallenge {
  k1: string;
  lnurl: string;
  expiresAt: Date;
}

export function generateChallenge(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function encodeLnurl(url: string): string {
  const base64 = Buffer.from(url).toString("base64url");
  return base64;
}

export async function verifySignature(k1: string, sig: string, key: string): Promise<boolean> {
  try {
    const k1Bytes = hexToBytes(k1);
    const sigBytes = hexToBytes(sig);
    const keyBytes = hexToBytes(key);

    const isValid = await secp.verify(sigBytes, k1Bytes, keyBytes);
    return isValid;
  } catch (error) {
    logError(error as Error, {
      context: "lnurl-signature-verification",
      k1Length: k1.length,
      sigLength: sig.length,
      keyLength: key.length,
    });
    return false;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const cleaned = hex.replace(/^0x/, "");
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.substring(i, i + 2), 16);
  }
  return bytes;
}
