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

interface RecoveredSignature {
  pubkey: string;
  timestamp: number;
}

export async function recoverPubkeyFromSignature(
  base64Sig: string
): Promise<RecoveredSignature | null> {
  try {
    const sigBytes = Buffer.from(base64Sig, "base64");

    if (sigBytes.length !== 65) {
      return null;
    }

    const recoveryFlag = sigBytes[0];
    const recoveryId = (recoveryFlag - 27) & 3;

    if (recoveryId < 0 || recoveryId > 3) {
      return null;
    }

    const signature = sigBytes.slice(1, 65);

    const now = Math.floor(Date.now() / 1000);
    const timestampsToTry = [now];
    for (let offset = 1; offset <= 300; offset++) {
      timestampsToTry.push(now - offset);
      timestampsToTry.push(now + offset);
    }

    for (const timestamp of timestampsToTry) {
      try {
        const message = createLightningMessage(timestamp);
        const messageHash = doubleSha256(message);

        const sig = secp.Signature.fromCompact(signature).addRecoveryBit(recoveryId);
        const recoveredPoint = sig.recoverPublicKey(messageHash);
        const recoveredPubkey = recoveredPoint.toRawBytes(true);

        if (
          recoveredPubkey.length === 33 &&
          (recoveredPubkey[0] === 0x02 || recoveredPubkey[0] === 0x03)
        ) {
          const pubkeyHex = bytesToHex(recoveredPubkey);

          if (timestamp > now + 60) {
            continue;
          }

          if (timestamp < now - 300) {
            continue;
          }

          return { pubkey: pubkeyHex, timestamp };
        }
      } catch {
        continue;
      }
    }

    return null;
  } catch (error) {
    logError(error as Error, {
      context: "signature-recovery",
      sigLength: base64Sig.length,
    });
    return null;
  }
}

function createLightningMessage(timestamp: number): Uint8Array {
  const prefix = Buffer.from("Lightning Signed Message:");
  const timestampBuffer = Buffer.alloc(8);
  timestampBuffer.writeBigUInt64BE(BigInt(timestamp));
  return new Uint8Array(Buffer.concat([prefix, timestampBuffer]));
}

function doubleSha256(message: Uint8Array): Uint8Array {
  const hash1 = sha256(message);
  const hash2 = sha256(hash1);
  return hash2;
}

export async function verifySignature(
  _k1: string,
  base64Sig: string
): Promise<RecoveredSignature | null> {
  try {
    const recovered = await recoverPubkeyFromSignature(base64Sig);

    if (!recovered) {
      return null;
    }

    return recovered;
  } catch (error) {
    logError(error as Error, {
      context: "lnurl-signature-verification",
      sigLength: base64Sig.length,
    });
    return null;
  }
}
