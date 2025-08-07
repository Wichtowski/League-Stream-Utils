# League Stream Utils 🎮

A comprehensive application for managing League of Legends tournaments, pick/ban sessions, and streaming setups. Built with modern web technologies and designed for tournament organizers, streamers, and esports teams.

## 📋 Project Overview

League Stream Utils is a full-stack application that provides:

- **Tournament Management**: Create and manage tournament brackets with team registration
- **Pick/Ban System**: Real-time champion select interface with LCU integration
- **Team Management**: Player verification and team organization tools
- **Streaming Integration**: OBS-ready overlays and scenes for professional broadcasts
- **Camera Management**: Multi-stream camera feeds and layout management
- **Admin Dashboard**: Comprehensive management interface with security monitoring
- **Electron Desktop App**: Cross-platform desktop application for enhanced functionality

## 🛠️ Technologies Used

### Frontend

- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons

### Backend

- **Node.js** - JavaScript runtime
- **Next.js API Routes** - Server-side API endpoints
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing

### Desktop Application

- **Electron** - Cross-platform desktop app framework
- **WebSocket** - Real-time communication

### Development Tools

- **Bun** - Fast JavaScript runtime and package manager
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Webpack** - Module bundling with optimizations

### External Integrations

- **Riot Games API** - League of Legends data
- **League Client Update (LCU)** - Live game data
- **OBS WebSocket** - Stream overlay integration
- **Stripe** - Payment processing (optional)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ or Bun
- MongoDB (for local data mode)
- Git

### Installation

1. **Clone the repository**

```bash
   git clone <repository-url>
   cd League-Stream-Utils
```

2. **Install dependencies**

```bash
    cd app
    bun install
    # or
    npm install
```

3. **Setup Local MongoDB (Recommended)**

```bash
    npm run setup
```

This will:
- Check MongoDB installation
- Start MongoDB container
- Create admin user (admin/admin123456789)
- Configure the application

4. **Manual Setup (Alternative)**

If you prefer to use an external MongoDB:

```bash
   cp env.example .env.local
```

Configure your environment variables:

```javascript
MONGODB_URI="mongodb://localhost:27017/league-stream-utils"
JWT_SECRET="your-super-strong-jwt-secret-at-least-32-characters"
ADMIN_USERNAME="your-admin-username"
ADMIN_PASSWORD="YourStrongPassword123!@#"
ADMIN_EMAIL="admin@yourdomain.com"
RIOT_API_KEY="your-riot-api-key"
```

Then create admin user:

```bash
    node scripts/create-admin.js
```

5. **Start Development Server**

```bash
   bun run dev
   # or
   npm run dev
```

6. **Desktop App (Optional)**

```bash
   bun run electron-dev
```

### MongoDB Management

The application includes local MongoDB management:

```bash
# Start MongoDB
npm run mongodb:start

# Stop MongoDB
npm run mongodb:stop

# Check status
npm run mongodb:status

# View logs
npm run mongodb:logs

# Reset data
npm run mongodb:reset
```

## 📁 Basic Folder Structure

```text
League-Stream-Utils/
├── app/                          # Main application
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── api/v1/          # API endpoints
│   │   │   ├── modules/         # Feature modules
│   │   │   └── layout.tsx       # Root layout
│   │   ├── lib/                 # Shared utilities
│   │   │   ├── components/      # React components
│   │   │   ├── contexts/        # React contexts
│   │   │   ├── database/        # Database schemas & connections
│   │   │   ├── services/        # Business logic services
│   │   │   ├── types/           # TypeScript type definitions
│   │   │   └── utils/           # Utility functions
│   │   └── theme/               # Styling and theming
│   ├── electron/                # Desktop app files
│   ├── public/                  # Static assets
│   ├── scripts/                 # Utility scripts
│   └── package.json
├── .github/                     # GitHub Actions workflows
├── readmes/                     # Detailed documentation
└── scripts/                     # External utility scripts
```

## 🤝 How to Contribute

We welcome contributions! Here's how you can help:

### 1. Fork the Repository

```bash
    # Fork on GitHub, then clone your fork
    git clone https://github.com/your-username/League-Stream-Utils.git
    cd League-Stream-Utils
```

### 2. Create a Feature Branch

```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b fix/your-bug-fix
```

### 3. Make Your Changes

- Follow the existing code style and patterns
- Add TypeScript types for new features
- Update documentation if needed
- Test your changes thoroughly

### 4. Commit Your Changes

```bash
    git add .
    git commit -m "feat: add new tournament feature"
    # or
    git commit -m "fix: resolve pick/ban timer issue"
```

### 5. Push and Create a Pull Request

```bash
    git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:

- Clear description of changes
- Screenshots if UI changes
- Test instructions if applicable

### Development Guidelines

- **TypeScript**: Use strict typing, avoid `any` and `unknown`
- **Components**: Follow existing patterns in `src/lib/components/`
- **API Routes**: Use the structure in `src/app/api/v1/`
- **Database**: Follow schemas in `src/lib/database/schemas/`
- **Security**: Follow security best practices in the codebase

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate Limiting** and account lockout protection
- **Input Validation** and sanitization
- **Security Headers** (CSP, HSTS, XSS protection)
- **Audit Logging** for security events
- **Password Security** with bcrypt hashing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### RIOT Games Legal Notice

**League Stream Utils** was created under Riot Games' "Legal Jibber Jabber" policy using assets owned by Riot Games. Riot Games does not endorse or sponsor this project.

This project uses the Riot Games API and is subject to Riot's [Developer Terms of Service](https://developer.riotgames.com/terms-of-service), [API Terms of Use](https://developer.riotgames.com/api-terms-of-use), and [Legal Jibber Jabber](https://www.riotgames.com/en/legal) policy.

**Important Notes:**

- This project is not endorsed by or affiliated with Riot Games
- League of Legends and Riot Games are trademarks of Riot Games, Inc.
- This is a non-commercial fan project created for the community
- API usage must comply with Riot's rate limits and terms of service
- Data obtained through the API is subject to Riot's data usage policies
- This project follows Riot's Legal Jibber Jabber guidelines for fan projects
- This project uses a valid, non-expirable Riot Games API key obtained through official registration

## 🆘 Support

- **Documentation**: Check the `readmes/` folder for detailed guides
- **Issues**: Report bugs and feature requests on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas

---

**Made with ❤️ for the League of Legends community**
