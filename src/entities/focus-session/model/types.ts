export type FocusSessionStatus = "idle" | "running" | "paused";

export interface FocusSession {
  id: string | null;
  missionId: string | null;
  missionTitle: string | null;
  targetMinutes: number;
  elapsedSeconds: number;
  status: FocusSessionStatus;
  deadlineLabel: string | null;
}
