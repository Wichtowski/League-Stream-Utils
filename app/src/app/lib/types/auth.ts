export interface AuthCredentials {
    username: string;
    password: string;
}

export interface User {
    id: string;
    username: string;
    password: string;
    passwordHistory: string[];
    email: string;
    isAdmin: boolean;
    sessionsCreatedToday: number;
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
    tokenType?: 'access' | 'refresh';
    sessionId?: string;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
}

export interface SessionData {
    id: string;
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    createdAt: Date;
    lastUsedAt: Date;
    ip?: string;
    userAgent?: string;
    isValid: boolean;
}
