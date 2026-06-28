import { hash, compare } from "bcryptjs";

const SALT_ROUNDS = 12;
const PASSWORD_HISTORY_SIZE = 5;
const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters`;
  if (password.length > MAX_LENGTH) return `Password must be at most ${MAX_LENGTH} characters`;

  return null;
}

export async function isPasswordReused(password: string, history: string[]): Promise<boolean> {
  for (const old of history.slice(0, PASSWORD_HISTORY_SIZE)) {
    if (await compare(password, old)) return true;
  }

  return false;
}
