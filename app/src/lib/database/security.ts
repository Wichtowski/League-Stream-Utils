import { connectToDatabase } from "./connection";
import { LoginAttemptModel, SecurityEventModel } from "./models";
import { config } from "@lib/config";
import { LoginAttempt, SecurityEvent } from "@lib/types/security";

export async function recordLoginAttempt(attempt: LoginAttempt): Promise<void> {
  await connectToDatabase();

  await LoginAttemptModel.create({
    ...attempt,
    timestamp: new Date(),
  });

  // Clean up old attempts (older than 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await LoginAttemptModel.deleteMany({
    timestamp: { $lt: oneDayAgo },
  });
}

export async function getFailedLoginAttempts(
  identifier: string,
  windowMs: number,
): Promise<number> {
  await connectToDatabase();

  const since = new Date(Date.now() - windowMs);

  const count = await LoginAttemptModel.countDocuments({
    identifier,
    success: false,
    timestamp: { $gte: since },
  });

  return count;
}

export async function isAccountLocked(identifier: string): Promise<boolean> {
  const failedAttempts = await getFailedLoginAttempts(
    identifier,
    config.security.lockoutDuration,
  );
  return failedAttempts >= config.security.maxLoginAttempts;
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  await connectToDatabase();

  await LoginAttemptModel.deleteMany({ identifier });
}

export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  await connectToDatabase();

  await SecurityEventModel.create({
    ...event,
    timestamp: new Date(),
  });

  // Clean up old events (older than 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await SecurityEventModel.deleteMany({
    timestamp: { $lt: thirtyDaysAgo },
  });
}

export async function getSecurityEvents(
  userId?: string,
  limit: number = 100,
): Promise<SecurityEvent[]> {
  await connectToDatabase();

  const query = userId ? { userId } : {};

  const results = await SecurityEventModel.find(query)
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();

  return results.map((doc) => ({
    timestamp: doc.timestamp,
    event: doc.event,
    userId: doc.userId,
    ip: doc.ip,
    userAgent: doc.userAgent,
    details: doc.details || {},
  }));
}
