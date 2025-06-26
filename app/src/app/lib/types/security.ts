export interface LoginAttempt {
    identifier: string;
    timestamp: Date;
    success: boolean;
    userAgent?: string;
    ip?: string;
  }
  
export interface SecurityEvent {
    timestamp: Date;
    event: string;
    userId?: string;
    ip?: string;
    userAgent?: string;
    details: Record<string, string | number | boolean>;
  }
  