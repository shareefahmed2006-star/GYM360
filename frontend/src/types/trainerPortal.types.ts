export interface TrainerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string[];
  experienceYears: number;
  bio: string;
  status: string;
  branch: {
    id: string;
    name: string;
  } | null;
}

export interface TrainerPortalStats {
  todaySessionsCount: number;
  activeClientsCount: number;
  completedSessionsMtd: number;
  weeklySlotsCount: number;
}

export interface SessionMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface TrainerSession {
  _id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  notes?: string;
  member?: SessionMember | null;
}

export interface AvailabilitySlot {
  _id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  status: string;
}

export interface TrainerDashboardData {
  trainer: TrainerProfile;
  stats: TrainerPortalStats;
  todaySessions: TrainerSession[];
  upcomingSessions: TrainerSession[];
  availabilitySlots: AvailabilitySlot[];
}

export interface TrainerClient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  totalSessions: number;
  completedSessions: number;
  upcomingSessions: number;
  lastSessionDate: string | null;
  lastSessionType: string | null;
}
