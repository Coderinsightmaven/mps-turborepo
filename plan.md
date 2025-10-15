# Tennis Tournament Scoring Application

**Architecture**: Turborepo monorepo using Bun package manager with shared workspace packages

## Phase 0: Shared Types Package

### 0.1 Create Shared Types Workspace

- Create `packages/types/` directory for shared TypeScript interfaces
- Add `packages/types/package.json` with workspace configuration
- Define types for: User, Player, Tournament, Match, MatchScore, WebSocket events
- Export all types from `packages/types/src/index.ts`
- Reference in other workspaces: `"@repo/types": "workspace:*"`

## Phase 1: Backend Foundation (mps-api)

### 1.1 Setup Core Infrastructure

- Switch from Express to Fastify in `apps/mps-api/src/main.ts`
- Install dependencies using **Bun** in mps-api workspace:
  ```bash
  cd apps/mps-api
  bun add @nestjs/platform-fastify @nestjs/websockets @nestjs/platform-ws @nestjs/jwt @nestjs/passport passport-jwt @prisma/client bcrypt class-validator class-transformer ws
  bun add -d prisma @types/bcrypt @types/passport-jwt @types/ws
  ```

- Initialize Prisma: `bunx prisma init` in mps-api directory
- Configure PostgreSQL connection in `apps/mps-api/.env`
- Add `@repo/types` workspace dependency

### 1.2 Database Schema Design

Create Prisma schema (`apps/mps-api/prisma/schema.prisma`) with models:

- **User** (id, email, password, name, role, createdAt)
- **Player** (id, name, ranking, country, stats, createdAt)
- **Tournament** (id, name, location, startDate, endDate, format, status)
- **Match** (id, tournamentId, player1Id, player2Id, status, scheduledAt, completedAt)
- **MatchScore** (id, matchId, currentSet, sets, games, points, server, winner, tiebreak data)
- Relations: User ↔ Tournament, Tournament ↔ Match, Match ↔ Player, Match ↔ MatchScore

Run migrations: `bunx prisma migrate dev --name init`

### 1.3 Authentication Module

Create `apps/mps-api/src/auth/`:

- `auth.module.ts` - JWT strategy configuration
- `auth.service.ts` - Login, register, token generation/validation with bcrypt
- `auth.controller.ts` - POST /auth/login, /auth/register
- `jwt.guard.ts` - Protected route guard
- `jwt.strategy.ts` - Passport JWT strategy

### 1.4 CRUD Modules

Create REST endpoints for:

- **Players** (`apps/mps-api/src/players/`): GET, POST, PUT, DELETE /players
- **Tournaments** (`apps/mps-api/src/tournaments/`): GET, POST, PUT, DELETE /tournaments
- **Matches** (`apps/mps-api/src/matches/`): GET, POST, PUT, DELETE /matches

Each module includes: service, controller, DTOs with class-validator, and Prisma integration

### 1.5 Tennis Scoring Engine

Create `apps/mps-api/src/scoring/`:

- `scoring.service.ts` - Core tennis scoring logic:
  - Point progression (0, 15, 30, 40, deuce, advantage)
  - Game winning conditions (4 points + 2 point lead)
  - Set winning (6 games + 2 game lead, or tiebreak at 6-6)
  - Match winning (best of 3 or 5 sets)
  - Tiebreak rules (first to 7 points + 2 point lead)
- `scoring.gateway.ts` - WebSocket gateway for live score updates
  - `@WebSocketGateway()` with Socket.IO adapter
  - Events: `match:update`, `match:start`, `match:end`, `point:scored`
  - Room-based broadcasting per match ID

Configure Fastify CORS for WebSocket connections

## Phase 2: Web Application (mps-web)

### 2.1 Setup Shadcn UI & Dependencies

- Navigate to `apps/mps-web` and run: `bunx shadcn@latest init`
- Install additional packages: `bun add axios socket.io-client @tanstack/react-query zustand date-fns`
- Add `@repo/types` workspace dependency
- Install Shadcn components: button, card, input, form, table, dialog, dropdown-menu, tabs, badge, toast, calendar, select
- Configure Tailwind with tournament-themed colors in `tailwind.config.ts`

### 2.2 Authentication & Layout

Create in `apps/mps-web/src/`:

- `lib/api.ts` - Axios client with JWT interceptor and base URL from env
- `lib/auth-store.ts` - Zustand store for auth state
- `app/(auth)/login/page.tsx` - Login form with Shadcn components
- `app/(auth)/register/page.tsx` - Registration form
- `app/(dashboard)/layout.tsx` - Dashboard layout with sidebar navigation
- `components/ProtectedRoute.tsx` - Route protection wrapper

### 2.3 Management Pages

Create admin interfaces in `apps/mps-web/src/app/(dashboard)/`:

- **players/page.tsx** - Data table with search, filter, add/edit/delete dialogs
- **tournaments/page.tsx** - Grid view with create wizard, edit form, delete confirmation
- **matches/page.tsx** - Schedule view with date picker, match cards, quick actions
- Use React Query for data fetching with proper cache invalidation

### 2.4 Live Match Viewing

Create `apps/mps-web/src/app/(dashboard)/matches/[id]/live/page.tsx`:

- Real-time score display (sets, games, points) in tennis scoreboard format
- Match statistics and point-by-point timeline
- WebSocket connection using Socket.IO client
- Visual scoreboard matching professional tennis broadcasts
- Auto-reconnect on connection loss

## Phase 3: Mobile Scoring App (mps-mobile)

### 3.1 Setup & Dependencies

- Navigate to `apps/mps-mobile` and install: `bun add socket.io-client @tanstack/react-query zustand`
- Add `@repo/types` workspace dependency
- Install Shadcn components or create mobile-optimized versions
- Configure Tauri permissions for network access in `src-tauri/capabilities/default.json`
- Add API base URL configuration in environment variables

### 3.2 Match Selection Interface

Create `apps/mps-mobile/src/pages/`:

- `MatchList.tsx` - Browse and filter active/upcoming matches
- Tournament grouping with search functionality
- Large, touch-friendly cards (min 60px height)
- Pull-to-refresh for match updates

### 3.3 Scoring Interface

Create `apps/mps-mobile/src/pages/Scoring.tsx`:

- **Large score display** at top: Sets | Games | Points for both players (min 80px)
- **Serve indicator** (🎾) showing current server
- **Touch-optimized buttons**:
  - Player 1 / Player 2 point buttons (full-width zones, 120px height)
  - Undo last point button (sticky bottom)
  - Match controls (start, pause, end match)
- **Real-time sync** via WebSocket to broadcast updates instantly
- **Score history** timeline at bottom showing last 10 points
- Landscape-optimized layout for tablets
- Haptic feedback on score (Tauri plugin)

### 3.4 Connection Management

- Create `apps/mps-mobile/src/lib/websocket.ts`:
  - Auto-reconnect WebSocket logic with exponential backoff
  - Offline detection with visual indicator
  - Queue score updates when offline, sync when back online
  - Conflict resolution strategy (server wins)

## Phase 4: Integration & Testing

### 4.1 Turbo Configuration

Update `turbo.json` to add dev scripts that run all apps:

```json
{
  "pipeline": {
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Run full stack: `bun dev` from root (starts API, web, mobile concurrently)

### 4.2 End-to-End Flow Testing

1. Web: Create tournament, add players, schedule matches
2. Mobile: Select match, start scoring
3. Web: View live updates on dashboard
4. Mobile: Complete match with final score
5. Web: View final results and match statistics

### 4.3 WebSocket Event Flow

- Mobile scores point → API validates → DB update → Broadcast to all clients
- Web receives update → React Query cache invalidation → UI refresh
- Implement optimistic UI updates with rollback on error
- Handle concurrent updates from multiple devices

## Key Files to Create/Modify

**Shared:**

- `packages/types/src/index.ts` - All shared TypeScript types
- `packages/types/package.json` - Workspace package config

**Backend (mps-api):**

- `apps/mps-api/src/main.ts` - Switch to Fastify
- `apps/mps-api/prisma/schema.prisma` - Database models
- `apps/mps-api/src/scoring/scoring.gateway.ts` - WebSocket handler
- `apps/mps-api/src/auth/` - Full auth module
- `apps/mps-api/package.json` - Add workspace dependencies

**Web (mps-web):**

- `apps/mps-web/src/app/(dashboard)/players/page.tsx`
- `apps/mps-web/src/app/(dashboard)/tournaments/page.tsx`
- `apps/mps-web/src/app/(dashboard)/matches/page.tsx`
- `apps/mps-web/src/lib/api.ts` - API client
- `apps/mps-web/package.json` - Add workspace dependencies

**Mobile (mps-mobile):**

- `apps/mps-mobile/src/pages/Scoring.tsx` - Main scoring interface
- `apps/mps-mobile/src/lib/websocket.ts` - WebSocket connection manager
- `apps/mps-mobile/src/lib/tennis-scoring.ts` - Local scoring logic
- `apps/mps-mobile/package.json` - Add workspace dependencies

## Technical Considerations

- Use TypeScript strict mode across all apps
- All package installations use **Bun** (`bun add`, `bun install`)
- Leverage Turborepo caching for builds (`turbo build`)
- Share types via `@repo/types` workspace package
- Implement proper error handling and validation
- Use React Query for data fetching in web/mobile
- Add loading states and optimistic updates
- Consider match state recovery after connection loss
- Use Bun's fast test runner for unit tests