import { getDb, sql } from '@lsu/db';
import { json, error } from '@/api/_helpers';
import { getTotalClientCount, getActiveSessionIds } from '../draft/[sessionId]/ws/room';

export async function GET() {
  const checks: Record<string, unknown> = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  try {
    await sql`SELECT 1`.execute(getDb());
    checks.postgres = 'connected';
  } catch {
    checks.postgres = 'disconnected';
    checks.status = 'degraded';
  }

  checks.websockets = {
    totalClients: getTotalClientCount(),
    activeSessions: getActiveSessionIds().length,
  };

  const statusCode = checks.status === 'ok' ? 200 : 503;
  return json(checks, statusCode);
}
