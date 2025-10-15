// User and Authentication Types
export interface User {
  id: string;
  email: string;
  password?: string; // Excluded in responses
  name: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  SCORER = 'SCORER',
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// Player Types
export interface Player {
  id: string;
  name: string;
  ranking?: number;
  country?: string;
  stats: PlayerStats;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesLost: number;
  setsWon: number;
  setsLost: number;
  gamesWon: number;
  gamesLost: number;
}

export interface CreatePlayerDto {
  name: string;
  ranking?: number;
  country?: string;
}

export interface UpdatePlayerDto {
  name?: string;
  ranking?: number;
  country?: string;
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  location: string;
  startDate: Date;
  endDate: Date;
  format: TournamentFormat;
  status: TournamentStatus;
  createdAt: Date;
  updatedAt: Date;
  matches?: Match[];
}

export enum TournamentFormat {
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  DOUBLE_ELIMINATION = 'DOUBLE_ELIMINATION',
  ROUND_ROBIN = 'ROUND_ROBIN',
  SWISS = 'SWISS',
}

export enum TournamentStatus {
  UPCOMING = 'UPCOMING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CreateTournamentDto {
  name: string;
  location: string;
  startDate: Date | string;
  endDate: Date | string;
  format: TournamentFormat;
}

export interface UpdateTournamentDto {
  name?: string;
  location?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  format?: TournamentFormat;
  status?: TournamentStatus;
}

// Match Types
export interface Match {
  id: string;
  tournamentId: string;
  tournament?: Tournament;
  player1Id: string;
  player1?: Player;
  player2Id: string;
  player2?: Player;
  status: MatchStatus;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  winnerId?: string;
  bestOf: number; // 3 or 5 sets
  currentScore?: MatchScore;
  createdAt: Date;
  updatedAt: Date;
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CreateMatchDto {
  tournamentId: string;
  player1Id: string;
  player2Id: string;
  scheduledAt?: Date | string;
  bestOf?: number;
}

export interface UpdateMatchDto {
  scheduledAt?: Date | string;
  status?: MatchStatus;
  bestOf?: number;
}

// Tennis Scoring Types
export interface MatchScore {
  id: string;
  matchId: string;
  currentSet: number;
  sets: SetScore[];
  games: [number, number]; // Current set games
  points: [TennisPoint, TennisPoint];
  server: 1 | 2; // Which player is serving
  winnerId?: string;
  inTiebreak: boolean;
  tiebreakPoints?: [number, number];
  history: PointHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SetScore {
  setNumber: number;
  player1Games: number;
  player2Games: number;
  player1TiebreakPoints?: number;
  player2TiebreakPoints?: number;
  winnerId?: string;
}

export type TennisPoint = 0 | 15 | 30 | 40 | 'AD';

export interface PointHistory {
  timestamp: Date;
  pointWinner: 1 | 2;
  score: {
    sets: SetScore[];
    games: [number, number];
    points: [TennisPoint, TennisPoint];
  };
}

// WebSocket Event Types
export enum WebSocketEvent {
  // Client to Server
  JOIN_MATCH = 'join_match',
  LEAVE_MATCH = 'leave_match',
  SCORE_POINT = 'score_point',
  UNDO_POINT = 'undo_point',
  START_MATCH = 'start_match',
  END_MATCH = 'end_match',
  
  // Server to Client
  MATCH_UPDATED = 'match_updated',
  MATCH_STARTED = 'match_started',
  MATCH_ENDED = 'match_ended',
  POINT_SCORED = 'point_scored',
  ERROR = 'error',
}

export interface WebSocketMessage<T = any> {
  event: WebSocketEvent;
  data: T;
  timestamp: Date;
}

export interface JoinMatchMessage {
  matchId: string;
}

export interface ScorePointMessage {
  matchId: string;
  pointWinner: 1 | 2;
}

export interface UndoPointMessage {
  matchId: string;
}

export interface MatchUpdatedMessage {
  match: Match;
  score: MatchScore;
}

export interface ErrorMessage {
  message: string;
  code?: string;
}

