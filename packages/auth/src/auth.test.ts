import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  isPasswordReused,
} from './password';
import { checkRateLimit, getRateLimitHeaders } from './rate-limit';

describe('password', () => {
  it('hashPassword produces a bcrypt hash', async () => {
    const hash = await hashPassword('test1234');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('verifyPassword validates correct password', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('secret123', hash)).toBe(true);
  });

  it('verifyPassword rejects wrong password', async () => {
    const hash = await hashPassword('secret123');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('validatePasswordStrength rejects short passwords', () => {
    expect(validatePasswordStrength('abc')).toContain('at least 8');
  });

  it('validatePasswordStrength rejects overly long passwords', () => {
    expect(validatePasswordStrength('a'.repeat(200))).toContain('at most 128');
  });

  it('validatePasswordStrength accepts valid passwords', () => {
    expect(validatePasswordStrength('validPass123')).toBeNull();
  });

  it('isPasswordReused detects reuse', async () => {
    const hash = await hashPassword('mypassword');
    expect(await isPasswordReused('mypassword', [hash])).toBe(true);
  });

  it('isPasswordReused allows new password', async () => {
    const hash = await hashPassword('oldpassword');
    expect(await isPasswordReused('newpassword', [hash])).toBe(false);
  });
});

describe('rate-limit', () => {
  it('allows requests under limit', () => {
    const key = `test-${Date.now()}-${Math.random()}`;
    expect(checkRateLimit(key, 5)).toBe(true);
    expect(checkRateLimit(key, 5)).toBe(true);
  });

  it('blocks requests over limit', () => {
    const key = `block-${Date.now()}-${Math.random()}`;
    for (let i = 0; i < 3; i++) checkRateLimit(key, 3);
    expect(checkRateLimit(key, 3)).toBe(false);
  });

  it('getRateLimitHeaders returns correct structure', () => {
    const key = `headers-${Date.now()}-${Math.random()}`;
    checkRateLimit(key, 100);
    const headers = getRateLimitHeaders(key, 100);
    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('99');
    expect(Number(headers['X-RateLimit-Reset'])).toBeGreaterThan(0);
  });
});
