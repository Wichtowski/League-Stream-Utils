# League Stream Utils 🎮

A comprehensive esports tournament management platform for League of Legends. Built with modern web technologies and designed for tournament organizers, streamers, and esports teams to deliver professional broadcasting experiences.

## 📋 Project Overview

League Stream Utils is a full-stack application that provides:

- **Professional Pick/Ban System**: Real-time draft interface with timer management and fearless draft support
- **Tournament Management**: Complete bracket generation, team registration, and tournament administration
- **Streaming Integration**: OBS automation, camera management, and professional broadcast overlays
- **Team & Player Management**: Riot API integration for player verification and roster management
- **Analytics & Statistics**: Champion analytics, pick/ban rates, and performance tracking
- **Desktop Application**: Cross-platform Electron app with enhanced features and local storage

## 🛠️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router and standalone output
- **React 19** - Latest UI library with concurrent features
- **TypeScript 5** - Full type safety throughout the application
- **Tailwind CSS 4** - Utility-first CSS with PostCSS optimization

### Backend & Database
- **Next.js API Routes** - Server-side endpoints with middleware
- **MongoDB 6** - NoSQL database with Mongoose ODM
- **JWT Authentication** - Secure token-based auth with refresh tokens
- **bcryptjs** - Password hashing and security
- **Rate Limiting** - Built-in protection against abuse

### Desktop Application
- **Electron 31** - Cross-platform desktop framework
- **WebSocket** - Real-time communication between components
- **IPC Handlers** - Secure communication between main and renderer processes

### Development & Build Tools
- **Bun** - Fast JavaScript runtime and package manager
- **ESLint 9** - Code linting with Next.js configuration
- **Prettier** - Code formatting
- **Electron Builder** - Desktop app packaging and distribution
- **Webpack Optimization** - Advanced bundle splitting and compression

### External Integrations
- **Riot Games API** - Official League of Legends data and player verification
- **League Client Update (LCU)** - Live game data integration
- **Champion Cache System** - Optimized champion data management
- **Node Cache** - In-memory caching for performance

## 🚀 Quick Start

### Prerequisites

- **Bun** (recommended) or Node.js 18+
- **MongoDB** (local or remote instance)
- **Git**

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
```

3. **Environment Setup**
```bash
cp env.example .env.local
```

Configure your environment variables:
```env
MONGODB_URI="mongodb://localhost:27017/league-stream-utils"
JWT_SECRET="your-super-strong-jwt-secret-at-least-32-characters"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="YourStrongPassword123!@#"
ADMIN_EMAIL="admin@yourdomain.com"
RIOT_API_KEY="your-riot-api-key"
```

6. **Start Development Server**
```bash
bun run dev
```
The application will be available at `http://localhost:2137`

### Desktop Application

Run the desktop app alongside the web server:
```bash
bun run dev:electron
```

Run the desktop app (production style, creating exec file):
```bash
bun run electron-dev
```

Or run separately:
```bash
# Terminal 1: Start web server
bun run dev

# Terminal 2: Start Electron app
bun run electron
```

### Available Scripts

```bash
# Development
bun run dev              # Start Next.js development server
bun run electron-dev     # Start web server + Electron app
bun run electron         # Start Electron app only

# Production
bun run build           # Build for production
bun run start           # Start production server
bun run electron-build  # Build desktop app
bun run dist            # Build and package desktop app

# Utilities
bun run lint            # Run ESLint
bun run format          # Format code with Prettier
```

## 📁 Project Structure

```text
League-Stream-Utils/
├── app/                          # Main application
│   ├── src/
│   │   ├── app/                  # Next.js App Router
│   │   │   ├── api/             # API endpoints
│   │   │   ├── modules/         # Feature-based pages
│   │   │   ├── login/           # Authentication pages
│   │   │   ├── settings/        # Settings pages
│   │   │   └── layout.tsx       # Root layout with providers
│   │   ├── lib/                 # Core application library
│   │   │   ├── auth/            # Authentication logic
│   │   │   ├── components/      # Reusable React components
│   │   │   ├── contexts/        # React context providers
│   │   │   ├── database/        # MongoDB schemas & connections
│   │   │   ├── services/        # Business logic services
│   │   │   ├── types/           # TypeScript definitions
│   │   │   └── hooks/           # Custom React hooks
│   │   ├── libCamera/           # Camera management system
│   │   ├── libElectron/         # Electron integration
│   │   ├── libLeagueClient/     # LCU integration
│   │   ├── libPickban/          # Pick/ban system
│   │   ├── libTeam/             # Team management
│   │   ├── libTournament/       # Tournament system
│   │   └── electron/            # Electron main process
│   ├── public/                  # Static assets
│   │   └── assets/              # Game assets (champions, items, etc.)
│   ├── scripts/                 # Utility scripts
│   └── package.json
├── scripts/                     # External utilities
│   ├── fetchAccounts/           # Riot account fetching
│   └── lol-player-scrapper/     # Player data scraping
├── .github/                     # CI/CD workflows
└── .kiro/                       # Kiro IDE configuration
```

### Architecture Highlights

- **Modular Design**: Feature-based libraries (`lib*`) for separation of concerns
- **Context-Driven**: Comprehensive React context system for state management
- **Type Safety**: Full TypeScript coverage with strict typing
- **Security First**: JWT authentication, rate limiting, and input validation
- **Performance Optimized**: Bundle splitting, caching, and lazy loading

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
- Or vibe code it, I dont really care ¯\_(ツ)_/¯

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

- **TypeScript**: Strict typing throughout, avoid `any` - use proper interfaces and types
- **Components**: Follow feature-based organization in respective `lib*` directories
- **API Routes**: RESTful structure in `src/app/api/` with proper error handling
- **Database**: Mongoose schemas in `src/lib/database/` with validation
- **Security**: JWT auth, rate limiting, input validation, and CSP headers
- **Performance**: Bundle optimization, lazy loading, and efficient re-renders
- **Code Style**: ESLint + Prettier with Next.js configuration
- **Testing**: Focus on behavior over implementation details

See `app/rules.md` for detailed coding guidelines and best practices.

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with refresh token rotation
- **Password Security**: bcryptjs hashing with salt rounds
- **Rate Limiting**: Built-in protection against brute force attacks
- **Input Validation**: Comprehensive sanitization and validation
- **Security Headers**: CSP, HSTS, XSS protection, and frame options
- **Account Protection**: Lockout mechanisms and audit logging
- **Environment Security**: Secure secret management and validation
- **API Security**: Protected endpoints with proper authorization

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

## 🆘 Support & Documentation

- **Issues**: Report bugs and feature requests on GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and community support
- **Code Guidelines**: See `app/rules.md` for development standards
- **Scripts**: Utility scripts in `app/scripts/` for common tasks

## 🎯 Key Features

### Tournament Management
- Complete bracket generation and management
- Team registration with Riot API verification
- Match scheduling and result tracking
- Tournament statistics and analytics

### Pick/Ban System
- Professional draft interface with real-time updates
- Timer management and phase control
- Fearless draft support
- Champion analytics and statistics

### Streaming Integration
- OBS automation and scene management
- Camera feed management and layouts
- Professional broadcast overlays
- Real-time data synchronization

### Desktop Application
- Cross-platform Electron app
- Enhanced local features and storage
- Tournament templates and presets
- Offline capability for events

---

**Made with ❤️ for the League of Legends community**
