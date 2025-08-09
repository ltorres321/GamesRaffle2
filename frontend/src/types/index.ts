// User types
export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  isAgeVerified: boolean;
  role: 'Player' | 'Admin' | 'SuperAdmin' | 'Vendor';
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Contest types
export interface Contest {
  id: string;
  title: string;
  description: string;
  league: 'NFL' | 'NBA' | 'MLB' | 'CFB';
  entryFee: number;
  prizePool: number;
  lockDate: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  maxEntrants: number;
  currentEntrants: number;
  isPublic: boolean;
  vendorId?: string;
  vendor?: Vendor;
  prizes: Prize[];
  rules: ContestRules;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Prize types for vendor contests
export interface Prize {
  id: string;
  contestId: string;
  rank: number;
  title: string;
  description: string;
  value: number;
  category: 'vehicle' | 'vacation' | 'electronics' | 'cash' | 'other';
  imageUrl?: string;
  vendorId: string;
  vendor: Vendor;
}

// Vendor types
export interface Vendor {
  id: string;
  name: string;
  email: string;
  company: string;
  logoUrl?: string;
  description: string;
  isApproved: boolean;
  createdAt: string;
}

// Entry types
export interface Entry {
  id: string;
  userId: string;
  contestId: string;
  weeks: EntryWeek[];
  isAlive: boolean;
  eliminatedWeek?: number;
  totalScore: number;
  rank?: number;
  user: User;
  contest: Contest;
  createdAt: string;
  updatedAt: string;
}

export interface EntryWeek {
  weekNumber: number;
  picks: Pick[];
  isLocked: boolean;
  score?: number;
}

// Week types
export interface Week {
  id: string;
  number: number;
  season: number;
  lockTime: string;
  isActive: boolean;
  isCompleted: boolean;
  matchups: Matchup[];
}

// Matchup types
export interface Matchup {
  id: string;
  weekId: string;
  week: Week;
  teamA: Team;
  teamB: Team;
  teamAId: string;
  teamBId: string;
  startTime: string;
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  teamAScore?: number;
  teamBScore?: number;
  winner?: string;
  odds?: string;
  notes?: string;
  isCompleted: boolean;
}

// Team types
export interface Team {
  id: string;
  name: string;
  alias: string;
  market: string;
  fullName: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  conference: 'AFC' | 'NFC';
  division: string;
  sportRadarId: string;
}

// Pick types
export interface Pick {
  id: string;
  entryId: string;
  weekId: string;
  teamId: string;
  team: Team;
  timestamp: string;
  isWinner?: boolean;
  isLocked: boolean;
  entry: Entry;
  week: Week;
}

// Wallet and Transaction types
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  currency: 'USD';
  isActive: boolean;
  user: User;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  walletId: string;
  type: 'deposit' | 'withdrawal' | 'entry_fee' | 'prize_payout' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  referenceId?: string;
  createdAt: string;
  updatedAt: string;
}

// GeoCheck types
export interface GeoCheck {
  id: string;
  userId: string;
  ipAddress: string;
  country: string;
  state: string;
  city: string;
  allowed: boolean;
  reason?: string;
  timestamp: string;
}

// Contest Rules
export interface ContestRules {
  maxPicks: number;
  picksPerWeek: { [week: number]: number };
  eliminationRules: string[];
  specialRules?: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// Contest filters for the lobby
export interface ContestFilters {
  league?: string;
  gameType?: string;
  entryFee?: {
    min?: number;
    max?: number;
  };
  payout?: string;
  status?: string;
}

// Pick board types
export interface PickBoardWeek {
  week: Week;
  picks: Pick[];
  isLocked: boolean;
  lockTime: string;
}

// Dashboard types
export interface DashboardStats {
  totalEntries: number;
  activeEntries: number;
  totalWinnings: number;
  winRate: number;
  rank?: number;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: 'contest_start' | 'picks_due' | 'elimination' | 'prize_won' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}