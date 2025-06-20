export interface AuthCredentials {
    username: string;
    password: string;
}

export interface User {
    id: string;
    username: string;
    password: string; // hashed
    email: string;
    isAdmin: boolean;
    sessionsCreatedToday: number;
    lastSessionDate: string; // YYYY-MM-DD format
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
}
  