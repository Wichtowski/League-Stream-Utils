// Validate critical environment variables - only on server side
function validateConfig() {
  // Skip validation on client side (browser/Electron)
  if (typeof window !== 'undefined') {
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Check for cryptographically secure characteristics
  const hasUppercase = /[A-Z]/.test(jwtSecret);
  const hasLowercase = /[a-z]/.test(jwtSecret);
  const hasNumbers = /[0-9]/.test(jwtSecret);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(jwtSecret);
  const entropy = new Set(jwtSecret).size; // Unique character count

  if (!hasUppercase || !hasLowercase || !hasNumbers || !hasSpecialChars) {
    throw new Error('JWT_SECRET must contain uppercase, lowercase, numbers, and special characters for security');
  }

  if (entropy < 16) {
    throw new Error('JWT_SECRET appears to have low entropy. Use a cryptographically secure random string');
  }

  // Check for common patterns that indicate weak secrets
  const commonPatterns = [
    /(.)\1{3,}/, // Repeated characters (4+ times)
    /123456|abcdef|qwerty/i, // Common sequences
    /password|secret|admin/i // Common words
  ];

  for (const pattern of commonPatterns) {
    if (pattern.test(jwtSecret)) {
      throw new Error('JWT_SECRET contains predictable patterns. Use a cryptographically secure random string');
    }
  }

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername) {
    throw new Error('ADMIN_USERNAME environment variable is required');
  }
  if (!adminPassword) {
    throw new Error('ADMIN_PASSWORD environment variable is required');
  }
}

validateConfig();

export const config = {
  auth: {
    username: process.env.ADMIN_USERNAME || '',
    password: process.env.ADMIN_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || '',
    expiresIn: '1h',
    refreshExpiresIn: '7d',
  },
  app: {
    name: 'League Stream Utils',
    baseUrl: process.env.NEXTAUTH_URL,
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
    rateLimitWindow: 15 * 60 * 1000,
    rateLimitMax: 250, // 250 requests per 15 minutes
  },
  pickBan: {
    banPhases: 3,
    pickPhases: 5,
    banDuration: 30000, // 30 seconds
    pickDuration: 30000, // 30 seconds
  },
  database: {
    uri: process.env.MONGODB_URI,
  },
  riot: {
    apiKey: process.env.RIOT_API_KEY,
  },
}; 