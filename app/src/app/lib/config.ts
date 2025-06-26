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