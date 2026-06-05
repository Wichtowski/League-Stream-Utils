export const keys = {
  teams: {
    all: ["teams"] as const,
    detail: (id: string) => ["teams", id] as const,
  },
  cameras: {
    all: ["camera-configs"] as const,
    detail: (teamId: string) => ["camera-configs", teamId] as const,
  },
  tournaments: {
    all: ["tournaments"] as const,
    detail: (id: string) => ["tournaments", id] as const,
    matches: (id: string) => ["tournaments", id, "matches"] as const,
  },
  matches: {
    detail: (id: string) => ["matches", id] as const,
  },
  draft: {
    all: ["draft-sessions"] as const,
    detail: (id: string) => ["draft-sessions", id] as const,
  },
  commentators: {
    all: ["commentators"] as const,
  },
  admin: {
    users: ["admin", "users"] as const,
    userSessions: (id: string) => ["admin", "users", id, "sessions"] as const,
    securityEvents: (type?: string) => ["admin", "security", "events", type] as const,
    sessions: ["admin", "security", "sessions"] as const,
    loginAttempts: ["admin", "security", "login-attempts"] as const,
    tournaments: ["admin", "tournaments"] as const,
    systemHealth: ["admin", "system", "health"] as const,
  },
} as const;
