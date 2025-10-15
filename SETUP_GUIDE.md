# Tennis Tournament System - Quick Setup Guide

## Prerequisites Check

Before starting, ensure you have:

- [ ] Bun 1.3.0+ installed (`bun --version`)
- [ ] PostgreSQL 14+ installed and running (`psql --version`)
- [ ] Node.js 18+ (for some tooling)
- [ ] Rust and Cargo (for Tauri mobile app): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

## Step-by-Step Setup

### 1. Install Dependencies

```bash
bun install
```

This installs all packages across the monorepo and links workspace packages.

### 2. Setup PostgreSQL Database

```bash
# Create database
createdb tennis_tournament

# Or using psql:
psql -U postgres
CREATE DATABASE tennis_tournament;
\q
```

### 3. Configure Backend Environment

Create `apps/mps-api/.env`:

```bash
cat > apps/mps-api/.env << 'EOF'
DATABASE_URL="postgresql://postgres:password@localhost:5432/tennis_tournament?schema=public"
JWT_SECRET="change-this-to-a-secure-random-string"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
EOF
```

**Important**: Replace `password` with your PostgreSQL password!

### 4. Run Database Migrations

```bash
cd apps/mps-api
bun run prisma:generate
bun run prisma:migrate
cd ../..
```

You should see:
```
✔ Generated Prisma Client
✔ Database synchronized
```

### 5. Configure Web App Environment

Create `apps/mps-web/.env.local`:

```bash
cat > apps/mps-web/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
EOF
```

### 6. Configure Mobile App Environment

Create `apps/mps-mobile/.env`:

```bash
cat > apps/mps-mobile/.env << 'EOF'
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
EOF
```

### 7. Start Development Servers

#### Option A: All at once (Recommended)

```bash
bun dev
```

This starts all three applications simultaneously using Turborepo:
- **mps-api**: NestJS with hot reload (Port 3001)
- **mps-web**: Next.js with Turbopack (Port 3000)
- **mps-mobile**: Tauri desktop app (Port 1420)

#### Option B: Individual terminals

**Terminal 1 - API:**
```bash
cd apps/mps-api
bun run dev
# Or: bun run start:dev
```

**Terminal 2 - Web:**
```bash
cd apps/mps-web
bun run dev
```

**Terminal 3 - Mobile (Tauri Desktop):**
```bash
cd apps/mps-mobile
bun run dev
```

**Mobile (Web-only for testing):**
```bash
cd apps/mps-mobile
bun run dev:web
```

### 8. Access the Applications

**Port Summary** (no overlaps):
- **API Server (Backend + WebSocket)**: Port **3001**
- **Web App (Next.js)**: Port **3000**
- **Mobile App (Vite)**: Port **1420**
- **Mobile HMR**: Port **1421**
- **Prisma Studio**: Port **5555** (when running)

Access URLs:
- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **API Health**: http://localhost:3001 (should see "Hello World!")
- **Mobile App**: http://localhost:1420 (in browser) or Tauri window (`bun run tauri dev`)

## First Time Usage

### 1. Create Account
1. Go to http://localhost:3000
2. You'll be redirected to `/login`
3. Click "Register"
4. Fill in:
   - Name: Your Name
   - Email: your@email.com
   - Password: password123
5. Click "Register"
6. You'll be automatically logged in and redirected to the dashboard

### 2. Add Players
1. Navigate to "Players" (should be the default page)
2. Click "Add Player"
3. Add at least 2 players:
   - Example: Roger Federer, Ranking: 1, Country: SUI
   - Example: Rafael Nadal, Ranking: 2, Country: ESP

### 3. Create Tournament
1. Navigate to "Tournaments"
2. Click "Create Tournament"
3. Fill in:
   - Name: Summer Open 2025
   - Location: New York, USA
   - Start Date: Today
   - End Date: Tomorrow
   - Format: Single Elimination
4. Click "Create Tournament"

### 4. Schedule Match
1. Navigate to "Matches"
2. Click "Schedule Match"
3. Select:
   - Tournament: Summer Open 2025
   - Player 1: Roger Federer
   - Player 2: Rafael Nadal
   - Best of: 3 sets
4. Click "Create Match"

### 5. Score the Match (Mobile App)
1. Open the mobile app (http://localhost:1420 in browser, or Tauri window)
2. You should see your match in the list
3. Click on the match
4. The scoring interface will open
5. Click "Start Match" if prompted
6. Tap player buttons to score points
7. Watch the score update following tennis rules!

### 6. View Live (Web App)
1. Go back to the web app
2. Navigate to "Matches"
3. Click "View Live" on your in-progress match
4. Watch the score update in real-time as you score in the mobile app!

## Verification Checklist

After setup, verify:

- [ ] Backend is running on port **3001** (API + WebSocket)
- [ ] Can access http://localhost:3001 (shows "Hello World!")
- [ ] Web app is running on port **3000**
- [ ] Mobile app is running on port **1420**
- [ ] Can register and login
- [ ] Can create players
- [ ] Can create tournaments
- [ ] Can schedule matches
- [ ] Mobile app loads and shows matches
- [ ] Can score points in mobile app
- [ ] Web app shows live updates in real-time

## Common Issues

### Issue: "Database connection failed"
**Solution**: 
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Check password is correct
- Ensure database exists: `psql -l | grep tennis_tournament`

### Issue: "WebSocket connection failed"
**Solution**:
- Ensure backend is running
- Check firewall isn't blocking port 3001
- Verify WS_URL environment variables are correct
- Check browser console for errors

### Issue: "Prisma Client not generated"
**Solution**:
```bash
cd apps/mps-api
bun run prisma:generate
```

### Issue: "Port already in use"
**Solution**:
```bash
# Find which process is using a port (replace PORT_NUMBER)
# Windows:
netstat -ano | findstr :PORT_NUMBER

# Mac/Linux:
lsof -i :PORT_NUMBER

# Kill the process
# Windows:
taskkill /PID <PID> /F

# Mac/Linux:
kill -9 <PID>

# Or use different ports (update .env files accordingly):
# Web: PORT=3002 bun run dev
# API: Change PORT in apps/mps-api/.env
# Mobile: Edit vite.config.ts to change port 1420
```

**Default ports used:**
- API: 3001 (includes WebSocket on same port)
- Web: 3000
- Mobile: 1420, 1421 (HMR)
- Prisma Studio: 5555

### Issue: "Cannot find module '@repo/types'"
**Solution**:
```bash
# From root directory
bun install
```

### Issue: Tauri build fails
**Solution**:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Install system dependencies (Ubuntu/Debian)
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
```

## Database Management

### View Data with Prisma Studio
```bash
cd apps/mps-api
bun run prisma:studio
```
Opens at http://localhost:5555

### Reset Database
```bash
cd apps/mps-api
bunx prisma migrate reset
```

### Create New Migration
```bash
cd apps/mps-api
bunx prisma migrate dev --name description_of_change
```

## Production Build

### Build All Apps
```bash
bun run build
```

### Build Individual Apps
```bash
# API
cd apps/mps-api
bun run build

# Web
cd apps/mps-web
bun run build

# Mobile (creates native binaries)
cd apps/mps-mobile
bun run tauri build
```

## Next Steps

Once everything is working:

1. **Customize** the system for your needs
2. **Add more features** (check the codebase structure)
3. **Deploy** to production (see deployment guides for NestJS, Next.js, and Tauri)
4. **Configure** production database
5. **Set up** proper environment variables for production
6. **Enable** HTTPS/WSS for secure WebSocket connections

## Getting Help

- Check the main README.md for architecture details
- Review the code comments
- Check console logs for errors
- Open an issue on the repository

## Development Tips

- Use **Prisma Studio** to inspect database: `bun run prisma:studio`
- Use **React Query Devtools** in browser for debugging queries
- Check WebSocket connection in browser Network tab (WS filter)
- Use browser DevTools for mobile app debugging
- Set `NODE_ENV=development` for detailed error messages

