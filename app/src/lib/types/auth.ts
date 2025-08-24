export interface AuthCredentials {
  username: string;
  password: string;
}

export interface User {
  _id: string;
  username: string;
  password: string;
  passwordHistory: string[];
  email: string;
  isAdmin: boolean;
  sessionsCreatedToday: number;
  lastSessionDate: Date;
  createdAt: Date;
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
  _id: string;
  userId: string;
  username: string;
  isAdmin: boolean;
  createdAt: Date;
  expiresAt: Date;
}
