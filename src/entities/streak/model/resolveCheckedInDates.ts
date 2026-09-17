import { isQualifyingCheckin } from "@/entities/checkin/model/checkinQualifies";

export interface CheckinDateRow {
  date: string;
  applications: number | null;
  problems: number | null;
}

// "체크인된 날"의 조건 (OR):
// 1) checkins 행에 applications>0 또는 problems>0
// 2) 그날 완료(done=true)로 표시된 missions가 1개 이상 존재
//    (missions에는 완료 시각 컬럼이 없어 생성일(created_at)을 "그날"의 기준으로 삼는다)
export function resolveCheckedInDates(checkinRows: CheckinDateRow[], missionCompletedAts: string[]): string[] {
  const checkinDates = checkinRows.filter(isQualifyingCheckin).map((row) => row.date);
  const missionDates = missionCompletedAts.map((createdAt) => createdAt.slice(0, 10));
  return [...checkinDates, ...missionDates];
}
