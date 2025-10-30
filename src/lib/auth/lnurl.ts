import crypto from "crypto";
import * as secp from "@noble/secp256k1";
import { bech32 } from "bech32";
import { logError } from "@/lib/errors/logger";

if (typeof secp.utils !== "undefined") {
  secp.utils.sha256Sync = (message: Uint8Array) => {
    return new Uint8Array(crypto.createHash("sha256").update(message).digest());
  };
  secp.utils.hmacSha256Sync = (key: Uint8Array, ...messages: Uint8Array[]) => {
    const hmac = crypto.createHmac("sha256", key);
    messages.forEach((m) => hmac.update(m));
    return new Uint8Array(hmac.digest());
  };
}

export interface LNURLChallenge {
  k1: string;
  lnurl: string;
  expiresAt: Date;
}

export function generateChallenge(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function encodeLnurl(url: string): string {
  const words = bech32.toWords(Buffer.from(url, "utf8"));
  const encoded = bech32.encode("lnurl", words, 2000);
  return encoded.toUpperCase();
}

export function generateSphinxDeepLink(host: string, k1: string): string {
  const timestamp = Date.now();
  return `sphinx.chat://?action=auth&host=${host}&challenge=${k1}&ts=${timestamp}`;
}

export async function verifySignature(k1: string, sig: string, key: string): Promise<boolean> {
  try {
    const keyBytes = hexToBytes(key);

    const isValid = keyBytes.length === 33 && (keyBytes[0] === 0x02 || keyBytes[0] === 0x03);

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
