export function isValidPubkey(pubkey: string): boolean {
  return /^[0-9a-f]{66}$/i.test(pubkey);
}

export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidGithubUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?github\.com\/[\w-]+\/?$/.test(url);
}

export function isValidTwitterHandle(handle: string): boolean {
  return /^@?[a-zA-Z0-9_]{1,15}$/.test(handle);
}

export function sanitizeUsername(username: string): string {
  return username.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
}

export function sanitizeTwitterHandle(handle: string): string {
  return handle
    .replace(/^@/, "")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 15);
}

export function extractGithubUsername(url: string): string | null {
  const match = url.match(/github\.com\/([^\/]+)/);
  return match ? match[1] : null;
}

export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

export function isValidSatsAmount(sats: number, min: number, max: number): boolean {
  return isPositiveInteger(sats) && sats >= min && sats <= max;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
