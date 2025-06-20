export const config = {
  auth: {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  app: {
    name: 'League Stream Utils',
    baseUrl: process.env.NEXTAUTH_URL,
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