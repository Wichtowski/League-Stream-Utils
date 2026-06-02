import type { Kysely } from 'kysely';
import type { Database } from '@lsu/db/types';
import { generateTokens, verifyToken, generateAccessToken } from './jwt';
import { hashPassword, verifyPassword, validatePasswordStrength } from './password';
import { recordLoginAttempt, isLockedOut, clearFailedAttempts, logSecurityEvent } from './security';
import { generateVerificationToken, sendVerificationEmail } from './email';

export async function login(
  db: Kysely<Database>,
  username: string,
  password: string,
  ip: string,
  userAgent?: string,
) {
  const sanitized = username.replace(/[<>]/g, '').trim();

  if (await isLockedOut(db, sanitized)) {
    return { success: false as const, error: 'Account temporarily locked' };
  }

  const user = await db
    .selectFrom('users')
    .selectAll()
    .where('username', '=', sanitized)
    .executeTakeFirst();

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    await recordLoginAttempt(db, ip, sanitized, false);
    await logSecurityEvent(db, 'login_failed', ip, user?.id);
    return { success: false as const, error: 'Invalid credentials' };
  }

  if (user.is_locked && user.locked_until && user.locked_until > new Date()) {
    return { success: false as const, error: 'Account temporarily locked' };
  }

  const sessionId = crypto.randomUUID();
  const tokens = await generateTokens({
    userId: user.id,
    username: user.username,
    isAdmin: user.is_admin,
    sessionId,
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db
    .insertInto('sessions')
    .values({
      user_id: user.id,
      refresh_token: tokens.refreshToken,
      ip,
      user_agent: userAgent ?? null,
      expires_at: expiresAt,
    })
    .execute();

  await db
    .updateTable('users')
    .set({ last_login_at: new Date(), last_login_ip: ip })
    .where('id', '=', user.id)
    .execute();

  await clearFailedAttempts(db, sanitized);
  await recordLoginAttempt(db, ip, sanitized, true);
  await logSecurityEvent(db, 'login_success', ip, user.id);

  return {
    success: true as const,
    tokens,
    user: { id: user.id, username: user.username, email: user.email, isAdmin: user.is_admin },
  };
}

export async function register(
  db: Kysely<Database>,
  username: string,
  email: string,
  password: string,
  ip: string,
) {
  const sanitizedUsername = username.replace(/[<>]/g, '').trim();
  const sanitizedEmail = email.replace(/[<>]/g, '').trim().toLowerCase();

  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(sanitizedUsername)) {
    return {
      success: false as const,
      error: 'Username must be 3-30 characters (letters, numbers, _, -)',
    };
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) return { success: false as const, error: passwordError };

  const existing = await db
    .selectFrom('users')
    .select('id')
    .where('username', '=', sanitizedUsername)
    .executeTakeFirst();

  if (existing) {
    return { success: false as const, error: 'Username already taken' };
  }

  const existingEmail = await db
    .selectFrom('users')
    .select('id')
    .where('email', '=', sanitizedEmail)
    .executeTakeFirst();

  if (existingEmail) {
    return { success: false as const, error: 'Email already registered' };
  }

  const pwHash = await hashPassword(password);

  const user = await db
    .insertInto('users')
    .values({ username: sanitizedUsername, email: sanitizedEmail, password_hash: pwHash })
    .returning(['id', 'username', 'email', 'is_admin'])
    .executeTakeFirstOrThrow();

  await db.insertInto('user_permissions').values({ user_id: user.id, role: 'viewer' }).execute();

  await logSecurityEvent(db, 'user_registered', ip, user.id);

  try {
    const token = await generateVerificationToken(db, user.id);
    await sendVerificationEmail(user.email, token);
  } catch {
    // email send failure shouldn't block registration
  }

  return { success: true as const, user: { ...user, isAdmin: user.is_admin } };
}

export async function validateSession(db: Kysely<Database>, refreshToken: string) {
  const payload = await verifyToken(refreshToken, 'refresh');
  if (!payload) return null;

  const session = await db
    .selectFrom('sessions')
    .selectAll()
    .where('refresh_token', '=', refreshToken)
    .where('is_valid', '=', true)
    .executeTakeFirst();

  if (!session || session.expires_at < new Date()) return null;

  const user = await db
    .selectFrom('users')
    .select(['id', 'username', 'email', 'is_admin'])
    .where('id', '=', session.user_id)
    .executeTakeFirst();

  if (!user) return null;

  await db
    .updateTable('sessions')
    .set({ last_used_at: new Date() })
    .where('id', '=', session.id)
    .execute();

  const accessToken = await generateAccessToken({
    userId: user.id,
    username: user.username,
    isAdmin: user.is_admin,
    sessionId: payload.sessionId,
    impersonatedBy: session.impersonated_by ?? undefined,
  });

  return {
    user: {
      ...user,
      isAdmin: user.is_admin,
      impersonatedBy: session.impersonated_by ?? undefined,
    },
    accessToken,
  };
}

export async function logout(db: Kysely<Database>, refreshToken: string) {
  await db
    .updateTable('sessions')
    .set({ is_valid: false })
    .where('refresh_token', '=', refreshToken)
    .execute();
}

export async function changePassword(
  db: Kysely<Database>,
  userId: string,
  currentPassword: string,
  newPassword: string,
  ip: string,
) {
  const user = await db.selectFrom('users').selectAll().where('id', '=', userId).executeTakeFirst();

  if (!user) return { success: false as const, error: 'User not found' };

  if (!(await verifyPassword(currentPassword, user.password_hash))) {
    return { success: false as const, error: 'Current password is incorrect' };
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) return { success: false as const, error: passwordError };

  const pwHash = await hashPassword(newPassword);

  await db
    .updateTable('users')
    .set({ password_hash: pwHash, updated_at: new Date() })
    .where('id', '=', userId)
    .execute();

  await logSecurityEvent(db, 'password_changed', ip, userId);

  return { success: true as const };
}
