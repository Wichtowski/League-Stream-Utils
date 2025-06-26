# League Stream Utils

A comprehensive application for managing League of Legends tournaments, pick/ban sessions, and streaming setups.

## 🔒 Security Features

This application implements enterprise-grade security measures:

- **Strong Authentication**: JWT with refresh tokens, secure httpOnly cookies
- **Account Protection**: Rate limiting, account lockout after failed attempts
- **Input Validation**: Comprehensive sanitization and validation
- **Security Headers**: CSP, HSTS, XSS protection, clickjacking prevention
- **Audit Logging**: Complete security event tracking
- **Password Security**: Strong password requirements, bcrypt hashing
- **CSRF Protection**: Cross-site request forgery prevention

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VML-Nexus-Cup/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup** ⚠️ **CRITICAL FOR SECURITY**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

   **REQUIRED SECURITY CONFIGURATION:**
   ```env
   # Generate a strong JWT secret (minimum 32 characters)
   JWT_SECRET=your-cryptographically-secure-random-string-32-chars-min

   # Set strong admin credentials
   ADMIN_USERNAME=your-admin-username
   ADMIN_PASSWORD=YourStrongPassword123!@#  # Min 12 chars, mixed case, numbers, symbols
   ADMIN_EMAIL=admin@yourdomain.com

   # Database connection
   MONGODB_URI=mongodb://localhost:27017/league-stream-utils
   ```

   **Security Requirements:**
   - `JWT_SECRET`: Use a cryptographically secure random string (32+ characters)
   - `ADMIN_PASSWORD`: Minimum 12 characters with uppercase, lowercase, numbers, and special characters
   - Never use default/weak passwords in production

4. **Database Setup**
   
   Start MongoDB and create the admin user:
   ```bash
   # Start MongoDB (if not running)
   mongod

   # Create admin user (in another terminal)
   node scripts/create-admin.js
   ```

5. **Start the application**
   ```bash
   npm run dev
   # or
   bun dev
   ```

## 🔐 Security Best Practices

### For Development:
- Always use strong environment variables
- Never commit secrets to version control
- Use different secrets for dev/staging/production
- Enable all security headers in production

### For Production:
- Use HTTPS exclusively (required for secure cookies)
- Implement Redis for session storage (replace in-memory store)
- Set up proper logging and monitoring
- Regular security audits and updates
- Configure firewall rules for database access

## 🛡️ Security Monitoring

Access the security dashboard at `/admin/security` (admin only) to monitor:
- Login attempts and failures
- Account lockouts
- Authentication events
- Security violations

## 🚨 Security Incident Response

If you suspect a security breach:
1. Check security logs in the admin dashboard
2. Review recent authentication events
3. Look for unusual IP addresses or patterns
4. Consider revoking all sessions if necessary

## 📊 Features

- **Tournament Management**: Create and manage tournament brackets
- **Pick/Ban System**: Real-time champion select interface
- **Team Management**: Player verification and team organization
- **Streaming Integration**: OBS-ready overlays and scenes
- **Camera Management**: Multi-stream camera feeds
- **Admin Dashboard**: Comprehensive management interface

## 🔧 Development

### Project Structure
```
app/
├── src/app/
│   ├── api/v1/           # API routes
│   ├── lib/
│   │   ├── auth.ts       # Authentication middleware
│   │   ├── utils/security.ts  # Security utilities
│   │   └── database/security.ts  # Security database operations
│   └── modules/          # Feature modules
├── scripts/              # Utility scripts
└── public/              # Static assets
```

### Security Architecture

- **Authentication Layer**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Input Validation**: Multi-layer sanitization
- **Rate Limiting**: IP-based with configurable limits
- **Session Management**: Secure session tracking
- **Audit Trail**: Comprehensive security logging

## 🤝 Contributing

1. Follow security best practices
2. Test authentication flows thoroughly
3. Update security documentation for new features
4. Never commit secrets or sensitive data

## 📄 License

[Your License Here]

---

⚠️ **Security Notice**: This application handles authentication and user data. Always follow security best practices and keep dependencies updated.
