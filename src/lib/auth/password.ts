import { pbkdf2Sync, randomBytes } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const parts = stored.split(":");
    if (parts.length !== 2) {
      return false;
    }
    const [salt, hash] = parts;
    const testHash = pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return hash === testHash;
  } catch {
    return false;
  }
}
