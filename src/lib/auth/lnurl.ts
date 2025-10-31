import crypto from "crypto";
import { bech32 } from "bech32";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
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
  const words = bech32.toWords(Buffer.from(url, "utf8"));
  const encoded = bech32.encode("lnurl", words, 2000);
  return encoded.toUpperCase();
}

export function generateSphinxDeepLink(host: string, k1: string): string {
  const timestamp = Date.now();
  return `sphinx.chat://?action=auth&host=${host}&challenge=${k1}&ts=${timestamp}`;
}

interface ParsedToken {
  timestamp: number;
  timestampBytes: Uint8Array;
  signature: Uint8Array;
}

function parseTokenString(base64Token: string): ParsedToken | null {
  try {
    const tokenBytes = Buffer.from(base64Token, "base64");

    if (tokenBytes.length !== 69) {
      return null;
    }

    const timestampBytes = tokenBytes.slice(0, 4);
    const timestamp = timestampBytes.readUInt32BE(0);
    const signature = tokenBytes.slice(4);

    return {
      timestamp,
      timestampBytes: new Uint8Array(timestampBytes),
      signature: new Uint8Array(signature),
    };
  } catch (error) {
    logError(error as Error, {
      context: "token-parsing",
      tokenLength: base64Token.length,
    });
    return null;
  }
}

async function verifyAndExtractPubkey(
  timestampBytes: Uint8Array,
  signature: Uint8Array
): Promise<string | null> {
  try {
    if (signature.length !== 65) {
      return null;
    }

    const prefix = Buffer.from("Lightning Signed Message:");
    const message = new Uint8Array(prefix.length + timestampBytes.length);
    message.set(new Uint8Array(prefix), 0);
    message.set(timestampBytes, prefix.length);

    const hash1 = sha256(message);
    const hash2 = sha256(hash1);

    const recoveryFlag = signature[0];
    const recoveryId = (recoveryFlag - 27) & 3;

    if (recoveryId < 0 || recoveryId > 3) {
      return null;
    }

    const compactSig = signature.slice(1, 65);
    const sig = secp.Signature.fromCompact(compactSig).addRecoveryBit(recoveryId);
    const recoveredPoint = sig.recoverPublicKey(hash2);
    const recoveredPubkey = recoveredPoint.toRawBytes(true);

    if (
      recoveredPubkey.length === 33 &&
      (recoveredPubkey[0] === 0x02 || recoveredPubkey[0] === 0x03)
    ) {
      const pubkeyHex = bytesToHex(recoveredPubkey);
      return pubkeyHex;
    }

    return null;
  } catch (error) {
    logError(error as Error, {
      context: "pubkey-recovery",
    });
    return null;
  }
}

export async function verifySphinxToken(
  token: string,
  claimedPubkey: string,
  checkTimestamp = true
): Promise<boolean> {
  try {
    const parsed = parseTokenString(token);
    if (!parsed) {
      return false;
    }

    const { timestamp, timestampBytes, signature } = parsed;

    if (checkTimestamp) {
      const now = Math.floor(Date.now() / 1000);

      if (timestamp > now) {
        return false;
      }

      if (timestamp < now - 300) {
        return false;
      }
    }

    const recoveredPubkey = await verifyAndExtractPubkey(timestampBytes, signature);

    if (!recoveredPubkey) {
      return false;
    }

    const match = recoveredPubkey === claimedPubkey;

    return match;
  } catch (error) {
    logError(error as Error, {
      context: "sphinx-token-verification",
      tokenLength: token.length,
      claimedPubkey,
    });
    return false;
  }
}
