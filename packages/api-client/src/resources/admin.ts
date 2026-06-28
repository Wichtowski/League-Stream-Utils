import { Resource } from "./base";

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_locked: boolean;
  email_verified?: boolean;
  plan?: string;
  plan_expires_at?: string;
  last_login_at: string | null;
  created_at: string;
}

interface SecurityEvent {
  id: string;
  type: string;
  user_id?: string;
  username?: string;
  ip?: string;
  details?: Record<string, unknown>;
  created_at: string;
}

interface SessionInfo {
  activeSessions: number;
  totalUsers: number;
  recentSessions: Array<Record<string, unknown>>;
}

interface UserSession {
  id: string;
  ip?: string;
  user_agent?: string;
  last_used_at: string;
  impersonated_by?: string;
}

interface AdminTournament {
  id: string;
  name: string;
  type: string;
  format: string;
  status: string;
  organizer_id: string;
  organizer_username: string;
  start_date: string | null;
  created_at: string;
}

interface HealthData {
  status: "healthy" | "degraded";
  checks: Record<string, { status: string; detail?: string }>;
  stats: {
    users: number;
    tournaments: number;
    teams: number;
    activeSessions: number;
  };
  runtime: {
    nodeVersion: string;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
}

export class AdminResource extends Resource {
  listUsers() {
    return this.get<User[]>("/api/v1/admin/users");
  }

  lockUser(userId: string) {
    return this.patch(`/api/v1/admin/users/${userId}`, { isLocked: true });
  }

  unlockUser(userId: string) {
    return this.patch(`/api/v1/admin/users/${userId}`, { isLocked: false });
  }

  deleteUser(userId: string) {
    return this.del(`/api/v1/admin/users/${userId}`);
  }

  setUserRole(userId: string, role: string) {
    return this.patch(`/api/v1/admin/users/${userId}/role`, { role });
  }

  setUserPlan(userId: string, plan: string, expiresAt?: string) {
    return this.patch(`/api/v1/admin/users/${userId}/plan`, { plan, expiresAt });
  }

  forceResetPassword(userId: string) {
    return this.post(`/api/v1/admin/users/${userId}/force-reset`);
  }

  impersonateUser(userId: string) {
    return this.post<{ accessToken: string }>(`/api/v1/admin/users/${userId}/impersonate`);
  }

  resendVerification(userId: string) {
    return this.post(`/api/v1/admin/users/${userId}/resend-verification`);
  }

  getUserSessions(userId: string) {
    return this.get<UserSession[]>(`/api/v1/admin/users/${userId}/sessions`);
  }

  getSecurityEvents(params?: { type?: string; limit?: number }) {
    return this.get<SecurityEvent[]>("/api/v1/admin/security/events", { params });
  }

  getSessionInfo() {
    return this.get<SessionInfo>("/api/v1/admin/security/sessions");
  }

  getLoginAttempts(params?: { limit?: number; success?: boolean }) {
    return this.get<SecurityEvent[]>("/api/v1/admin/security/login-attempts", { params });
  }

  updateTournament(id: string, data: Record<string, unknown>) {
    return this.patch(`/api/v1/admin/tournaments/${id}`, data);
  }

  listTournaments() {
    return this.get<AdminTournament[]>("/api/v1/admin/tournaments");
  }

  deleteTournament(id: string) {
    return this.del(`/api/v1/admin/tournaments/${id}`);
  }

  getSystemHealth() {
    return this.get<HealthData>("/api/v1/admin/system/health");
  }
}

export type { User, SecurityEvent, SessionInfo, UserSession, AdminTournament, HealthData };
