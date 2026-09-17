export interface DailyStats {
  totalFocusMinutes: number;
  focusAheadMinutes: number;
  delayMinutesToday: number;
  delayMinutesWeek: number;
}

export interface CheckinRecord {
  date: string;
  applications: number;
  problems: number;
}

export interface UpsertCheckinInput {
  applications?: number;
  problems?: number;
}
