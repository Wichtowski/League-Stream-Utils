// Permission system types for granular access control

export enum Permission {
  // Global permissions
  ADMIN_ALL = "ADMIN_ALL",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  SYSTEM_SETTINGS = "SYSTEM_SETTINGS",
  
  // Tournament permissions
  TOURNAMENT_CREATE = "TOURNAMENT_CREATE",
  TOURNAMENT_VIEW = "TOURNAMENT_VIEW",
  TOURNAMENT_EDIT = "TOURNAMENT_EDIT",
  TOURNAMENT_DELETE = "TOURNAMENT_DELETE",
  TOURNAMENT_PUBLISH = "TOURNAMENT_PUBLISH",
  TOURNAMENT_ADMIN = "TOURNAMENT_ADMIN",
  
  // Team management permissions
  TEAM_REGISTER = "TEAM_REGISTER",
  TEAM_UNREGISTER = "TEAM_UNREGISTER",
  TEAM_APPROVE = "TEAM_APPROVE",
  TEAM_REJECT = "TEAM_REJECT",
  
  // Match management permissions
  MATCH_CREATE = "MATCH_CREATE",
  MATCH_EDIT = "MATCH_EDIT",
  MATCH_DELETE = "MATCH_DELETE",
  MATCH_RESULT_EDIT = "MATCH_RESULT_EDIT",
  MATCH_SCHEDULE = "MATCH_SCHEDULE",
  
  // Broadcasting permissions
  STREAM_MANAGE = "STREAM_MANAGE",
  COMMENTATOR_ASSIGN = "COMMENTATOR_ASSIGN",
  CAMERA_MANAGE = "CAMERA_MANAGE",
  
  // Data permissions
  DATA_EXPORT = "DATA_EXPORT",
  STATS_VIEW = "STATS_VIEW",
  STATS_EDIT = "STATS_EDIT"
}

export enum Role {
  // Global roles
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  USER = "USER",
  
  // Tournament-specific roles
  TOURNAMENT_OWNER = "TOURNAMENT_OWNER",
  TOURNAMENT_ADMIN = "TOURNAMENT_ADMIN",
  TOURNAMENT_MODERATOR = "TOURNAMENT_MODERATOR",
  TOURNAMENT_VIEWER = "TOURNAMENT_VIEWER",
  
  // Specialized roles
  COMMENTATOR = "COMMENTATOR",
  STREAM_MANAGER = "STREAM_MANAGER",
  DATA_ANALYST = "DATA_ANALYST"
}

export interface RolePermission {
  role: Role;
  permissions: Permission[];
  description: string;
  isGlobal: boolean; // true for system-wide roles, false for tournament-specific
}

export interface TournamentPermission {
  _id?: string;
  tournamentId: string;
  userId: string;
  role: Role;
  grantedBy: string; // User ID who granted this permission
  grantedAt: Date;
  expiresAt?: Date; // Optional expiration date
  isActive: boolean;
}

export interface UserPermission {
  _id?: string;
  userId: string;
  role: Role;
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  scope?: string; // Optional scope (e.g., specific tournament ID)
}

export interface PermissionCheck {
  userId: string;
  permission: Permission;
  resourceId?: string; // Tournament ID, match ID, etc.
  context?: Record<string, unknown>; // Additional context for permission checking
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: Role;
  userRoles?: Role[];
}

// Predefined role-permission mappings
export const ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: Role.SUPER_ADMIN,
    permissions: [Permission.ADMIN_ALL],
    description: "Full system access with all permissions",
    isGlobal: true
  },
  {
    role: Role.ADMIN,
    permissions: [
      Permission.USER_MANAGEMENT,
      Permission.SYSTEM_SETTINGS,
      Permission.TOURNAMENT_CREATE,
      Permission.TOURNAMENT_VIEW,
      Permission.TOURNAMENT_EDIT,
      Permission.TOURNAMENT_DELETE,
      Permission.TOURNAMENT_PUBLISH,
      Permission.TOURNAMENT_ADMIN,
      Permission.TEAM_REGISTER,
      Permission.TEAM_UNREGISTER,
      Permission.TEAM_APPROVE,
      Permission.TEAM_REJECT,
      Permission.MATCH_CREATE,
      Permission.MATCH_EDIT,
      Permission.MATCH_DELETE,
      Permission.MATCH_RESULT_EDIT,
      Permission.MATCH_SCHEDULE,
      Permission.STREAM_MANAGE,
      Permission.COMMENTATOR_ASSIGN,
      Permission.CAMERA_MANAGE,
      Permission.DATA_EXPORT,
      Permission.STATS_VIEW,
      Permission.STATS_EDIT
    ],
    description: "System administrator with broad permissions",
    isGlobal: true
  },
  {
    role: Role.TOURNAMENT_OWNER,
    permissions: [
      Permission.TOURNAMENT_VIEW,
      Permission.TOURNAMENT_EDIT,
      Permission.TOURNAMENT_PUBLISH,
      Permission.TOURNAMENT_ADMIN,
      Permission.TEAM_REGISTER,
      Permission.TEAM_UNREGISTER,
      Permission.TEAM_APPROVE,
      Permission.TEAM_REJECT,
      Permission.MATCH_CREATE,
      Permission.MATCH_EDIT,
      Permission.MATCH_DELETE,
      Permission.MATCH_RESULT_EDIT,
      Permission.MATCH_SCHEDULE,
      Permission.STREAM_MANAGE,
      Permission.COMMENTATOR_ASSIGN,
      Permission.CAMERA_MANAGE,
      Permission.DATA_EXPORT,
      Permission.STATS_VIEW,
      Permission.STATS_EDIT
    ],
    description: "Full control over a specific tournament",
    isGlobal: false
  },
  {
    role: Role.TOURNAMENT_ADMIN,
    permissions: [
      Permission.TOURNAMENT_VIEW,
      Permission.TOURNAMENT_EDIT,
      Permission.TEAM_REGISTER,
      Permission.TEAM_UNREGISTER,
      Permission.TEAM_APPROVE,
      Permission.TEAM_REJECT,
      Permission.MATCH_CREATE,
      Permission.MATCH_EDIT,
      Permission.MATCH_DELETE,
      Permission.MATCH_RESULT_EDIT,
      Permission.MATCH_SCHEDULE,
      Permission.STREAM_MANAGE,
      Permission.COMMENTATOR_ASSIGN,
      Permission.CAMERA_MANAGE,
      Permission.STATS_VIEW,
      Permission.STATS_EDIT
    ],
    description: "Administrative access to a specific tournament",
    isGlobal: false
  },
  {
    role: Role.TOURNAMENT_MODERATOR,
    permissions: [
      Permission.TOURNAMENT_VIEW,
      Permission.TEAM_APPROVE,
      Permission.TEAM_REJECT,
      Permission.MATCH_EDIT,
      Permission.MATCH_RESULT_EDIT,
      Permission.STATS_VIEW
    ],
    description: "Moderation access to a specific tournament",
    isGlobal: false
  },
  {
    role: Role.TOURNAMENT_VIEWER,
    permissions: [
      Permission.TOURNAMENT_VIEW,
      Permission.STATS_VIEW
    ],
    description: "Read-only access to a specific tournament",
    isGlobal: false
  },
  {
    role: Role.COMMENTATOR,
    permissions: [
      Permission.TOURNAMENT_VIEW,
      Permission.STATS_VIEW,
      Permission.CAMERA_MANAGE
    ],
    description: "Commentator access with camera control",
    isGlobal: false
  },
  {
    role: Role.STREAM_MANAGER,
    permissions: [
      Permission.TOURNAMENT_VIEW,
      Permission.STREAM_MANAGE,
      Permission.CAMERA_MANAGE,
      Permission.COMMENTATOR_ASSIGN
    ],
    description: "Stream and broadcast management",
    isGlobal: false
  },
  {
    role: Role.DATA_ANALYST,
    permissions: [
      Permission.TOURNAMENT_VIEW,
      Permission.STATS_VIEW,
      Permission.STATS_EDIT,
      Permission.DATA_EXPORT
    ],
    description: "Data analysis and statistics management",
    isGlobal: false
  },
  {
    role: Role.USER,
    permissions: [
      Permission.TOURNAMENT_VIEW
    ],
    description: "Basic user with minimal permissions",
    isGlobal: true
  }
];

// Helper function to get permissions for a role
export const getPermissionsForRole = (role: Role): Permission[] => {
  const rolePermission = ROLE_PERMISSIONS.find(rp => rp.role === role);
  return rolePermission?.permissions || [];
};

// Helper function to check if a role has a specific permission
export const roleHasPermission = (role: Role, permission: Permission): boolean => {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission) || permissions.includes(Permission.ADMIN_ALL);
};

// Helper function to get all roles that have a specific permission
export const getRolesWithPermission = (permission: Permission): Role[] => {
  return ROLE_PERMISSIONS
    .filter(rp => rp.permissions.includes(permission) || rp.permissions.includes(Permission.ADMIN_ALL))
    .map(rp => rp.role);
};
