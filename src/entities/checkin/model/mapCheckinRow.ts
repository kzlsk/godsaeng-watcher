import type { CheckinRecord } from "./types";

export interface CheckinRow {
  date: string;
  applications: number | null;
  problems: number | null;
}

export function toCheckinRecord(row: CheckinRow): CheckinRecord {
  return {
    date: row.date,
    applications: row.applications ?? 0,
    problems: row.problems ?? 0,
  };
}
