export interface AuthCredentials {
  username: string;
  password: string;
}

import { Role } from "./permissions";

export interface User {
  _id: string;
  username: string;
  password: string;
  passwordHistory: string[];
  email: string;
  isAdmin: boolean;
  sessionsCreatedToday: number;
  globalRoles: Role[]; // Global roles stored in user document
  lastSessionDate: Date;
  createdAt: Date;
  isLocked?: boolean;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIP?: string;
}

export interface UserRegistration {
  username: string;
  password: string;
  email: string;
}

export interface JWTPayload {
  userId: string;
  username: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface SessionData {
  id: string;
  userId: string;
  username: string;
  isAdmin: boolean;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt: Date;
  isValid: boolean;
  refreshToken?: string;
  ip?: string;
  userAgent?: string;
}
