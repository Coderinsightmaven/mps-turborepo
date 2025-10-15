# Tennis Tournament Scoring System

A full-stack application for managing and scoring tennis tournaments with real-time updates.

## 🏗 Architecture

This is a **Turborepo** monorepo using **Bun** as the package manager, consisting of:

### Apps

- **mps-api** - NestJS backend with Fastify, PostgreSQL (Prisma), and WebSocket support
- **mps-web** - Next.js 15 web application for tournament management
- **mps-mobile** - Tauri v2 mobile/desktop app for live match scoring

### Packages

- **types** - Shared TypeScript types across all applications
- **ui** - Shared UI components
- **eslint-config** - Shared ESLint configurations
- **typescript-config** - Shared TypeScript configurations

## 🚀 Port Configuration

**All ports are configured with no overlaps:**

| Application | Port | Purpose |
|------------|------|---------|
| **mps-api** | 3001 | Backend API + WebSocket (same server) |
| **mps-web** | 3000 | Next.js web application |
| **mps-mobile** | 1420 | Vite dev server |
| **mps-mobile** | 1421 | Hot Module Replacement (HMR) |
| **Prisma Studio** | 5555 | Database management UI (when running) |

> **Note**: The WebSocket server runs on the same port as the API (3001), not a separate port. This simplifies deployment and firewall configuration.

## ✨ Features

### Backend (mps-api - Port 3001)
- ✅ JWT Authentication
- ✅ RESTful APIs for Players, Tournaments, and Matches
- ✅ Official Tennis Scoring Engine (sets, games, points, tiebreaks)
- ✅ Real-time WebSocket updates
- ✅ PostgreSQL database with Prisma ORM
- ✅ Fastify for high performance

### Web App (mps-web - Port 3000)
- ✅ Player management (CRUD)
- ✅ Tournament management (CRUD)
- ✅ Match scheduling
- ✅ Live match viewing with WebSocket integration
- ✅ Shadcn UI components with Tailwind CSS
- ✅ React Query for data fetching

### Mobile App (mps-mobile - Port 1420)
- ✅ Match selection interface
- ✅ Touch-friendly scoring interface
- ✅ Large, clear score display
- ✅ Real-time score synchronization
- ✅ Undo last point functionality
- ✅ Offline detection and auto-reconnect

## 📋 Prerequisites

- [Bun](https://bun.sh/) v1.3.0 or higher
- [PostgreSQL](https://www.postgresql.org/) 14+ running locally or remotely
- [Node.js](https://nodejs.org/) 18+ (for some tools)
- [Rust](https://www.rust-lang.org/) (for Tauri mobile app)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd matchpointsystems-turbo
bun install
```

### 2. Setup Database

```bash
createdb tennis_tournament
```

### 3. Configure Environment Variables

**Backend** (`apps/mps-api/.env`):
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tennis_tournament?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
```

**Web** (`apps/mps-web/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

**Mobile** (`apps/mps-mobile/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

### 4. Run Database Migrations

```bash
cd apps/mps-api
bun run prisma:generate
bun run prisma:migrate
cd ../..
```

### 5. Start Development Servers

```bash
# Start all applications concurrently with Turborepo
bun dev
```

This single command starts:
- **NestJS API** with hot reload on port 3001
- **Next.js Web** with Turbopack on port 3000
- **Tauri Desktop App** with the UI on port 1420

The applications will be available at:
- **API**: http://localhost:3001
- **Web**: http://localhost:3000
- **Mobile**: Tauri window opens automatically (UI at http://localhost:1420)

## 📖 Usage Guide

### 1. Create an Account
1. Open http://localhost:3000
2. Click "Register" and create an account
3. Login with your credentials

### 2. Add Players
1. Navigate to "Players" in the sidebar
2. Click "Add Player"
3. Enter player details (name, ranking, country)

### 3. Create a Tournament
1. Navigate to "Tournaments"
2. Click "Create Tournament"
3. Fill in tournament details

### 4. Schedule Matches
1. Navigate to "Matches"
2. Click "Schedule Match"
3. Select tournament, players, and match format

### 5. Score Matches (Mobile App)
1. Open http://localhost:1420 or run `bun run tauri dev`
2. Select a match from the list
3. Use the large buttons to score points
4. Watch the score update automatically following tennis rules

### 6. View Live Matches (Web)
1. Navigate to "Matches"
2. Click "View Live" on an in-progress match
3. Watch real-time score updates

## 🎾 Tennis Scoring Rules

The system implements official tennis scoring:

- **Points**: 0, 15, 30, 40, Deuce, Advantage
- **Games**: First to 4 points with 2-point lead
- **Sets**: First to 6 games with 2-game lead, or 7-6 with tiebreak
- **Tiebreak**: First to 7 points with 2-point lead
- **Match**: Best of 3 or 5 sets

## 🛠 Development

### Project Structure

```
matchpointsystems-turbo/
├── apps/
│   ├── mps-api/          # NestJS backend (Port 3001)
│   │   ├── src/
│   │   │   ├── auth/     # Authentication
│   │   │   ├── players/  # Player CRUD
│   │   │   ├── tournaments/
│   │   │   ├── matches/
│   │   │   ├── scoring/  # Tennis scoring engine & WebSocket
│   │   │   └── prisma/   # Database service
│   │   └── prisma/       # Database schema
│   ├── mps-web/          # Next.js web app (Port 3000)
│   │   └── src/
│   │       ├── app/      # Pages & layouts
│   │       ├── components/
│   │       └── lib/      # API & WebSocket clients
│   └── mps-mobile/       # Tauri mobile app (Port 1420)
│       └── src/
│           ├── pages/    # Match list & scoring
│           └── lib/      # API & WebSocket clients
└── packages/
    ├── types/            # Shared TypeScript types
    ├── ui/               # Shared UI components
    └── ...
```

### Available Scripts

#### Root
- `bun install` - Install all dependencies
- `bun dev` - Start all apps in development mode
- `bun build` - Build all apps
- `bun lint` - Lint all packages

#### Backend (apps/mps-api)
- `bun run dev` - Start NestJS with hot reload on port 3001
- `bun run start:dev` - Same as dev
- `bun run build` - Build for production
- `bun run prisma:studio` - Open Prisma Studio on port 5555
- `bun run prisma:migrate` - Run database migrations

#### Web (apps/mps-web)
- `bun run dev` - Start Next.js with Turbopack on port 3000
- `bun run build` - Build for production
- `bun run start` - Start production server

#### Mobile (apps/mps-mobile)
- `bun run dev` - Start Tauri desktop app (opens window)
- `bun run dev:web` - Start Vite only (web browser on port 1420)
- `bun run build` - Build native Tauri app
- `bun run build:web` - Build web assets only

## 🔧 Tech Stack

### Backend
- NestJS with Fastify
- Prisma ORM with PostgreSQL
- Native WebSockets (ws)
- JWT Authentication
- bcrypt for password hashing

### Web Frontend
- Next.js 15 with React 19
- TypeScript
- Tailwind CSS v4
- Shadcn UI
- React Query
- Zustand
- Axios

### Mobile
- Tauri v2
- React
- TypeScript
- Native WebSockets
- Vite

## 🐛 Troubleshooting

### Port Conflicts

If you get "port already in use" errors:

```bash
# Check what's using a port (Windows)
netstat -ano | findstr :3001

# Check what's using a port (Mac/Linux)
lsof -i :3001

# Kill the process
# Windows: taskkill /PID <PID> /F
# Mac/Linux: kill -9 <PID>
```

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database exists: `psql -l | grep tennis_tournament`

### WebSocket Connection Issues
- Verify API is running on port 3001
- Check WS_URL environment variables point to `ws://localhost:3001`
- Ensure firewall allows WebSocket connections

For more detailed troubleshooting, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## 📚 Documentation

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed setup instructions
- [Backend API Documentation](./apps/mps-api/README.md)
- [Web App Documentation](./apps/mps-web/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

UNLICENSED - Private project

## 📞 Support

For issues or questions, please open an issue on the repository.
