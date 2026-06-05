export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface JWTPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

export type Role = "developer" | "admin" | "organizer" | "moderator" | "commentator" | "viewer";
export type PermissionAction = "create" | "read" | "update" | "delete" | "manage";
export type PermissionResource =
  | "tournament"
  | "team"
  | "match"
  | "draft"
  | "camera"
  | "user"
  | "settings";
