import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { passwordRegex } from './constants';

export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' };
  }

  if (!passwordRegex.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    };
  }

  return { isValid: true };
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxAttempts: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxAttempts) {
    return false;
  }

  record.count++;
  return true;
}

// Get client IP for rate limiting
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return 'unknown';
}

export function logSecurityEvent(event: string, details: Record<string, string | number | boolean>): void {
  const timestamp = new Date().toISOString();
  console.log(`[SECURITY] ${timestamp} - ${event}:`, JSON.stringify(details));

}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 1000);
}

// Generate secure random token
export function generateSecureToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hash password with salt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Check if password was used before
export async function isPasswordReused(password: string, passwordHistory: string[]): Promise<boolean> {
  for (const oldHash of passwordHistory) {
    if (await bcrypt.compare(password, oldHash)) {
      return true;
    }
  }
  return false;
}

// Add current password to history and maintain limit
export function updatePasswordHistory(currentPassword: string, passwordHistory: string[], maxHistory: number = 5): string[] {
  const newHistory = [currentPassword, ...passwordHistory];
  return newHistory.slice(0, maxHistory);
} 