const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

// 하루의 시작점(새벽 2시 이전은 전날, 2시 이후는 당일)
const CUTOFF_HOUR = 2;
// 서버 실행 타임존(로컬/Vercel 등)과 무관하게 항상 KST(UTC+9) 기준으로 판정한다.
const APP_TZ_OFFSET_MINUTES = 9 * 60;

function toAppWallClock(reference: Date): Date {
  return new Date(reference.getTime() + APP_TZ_OFFSET_MINUTES * MS_PER_MINUTE);
}

// 새벽 2시를 하루의 시작으로 보는 "오늘"(YYYY-MM-DD, KST 기준)을 계산한다.
// 예: KST 새벽 1시는 어제 날짜, KST 새벽 2시 이후는 오늘 날짜로 판정한다.
export function getAppToday(reference: Date = new Date()): string {
  const wallClock = toAppWallClock(reference);
  const dayStart = new Date(wallClock.getTime() - CUTOFF_HOUR * MS_PER_HOUR);
  return dayStart.toISOString().slice(0, 10);
}

// getAppToday()가 반환하는 "앱 하루" 문자열에 대응하는 UTC 조회 범위를 반환한다.
// (해당 날짜 KST 새벽 2시 ~ 다음날 KST 새벽 2시, DB의 timestamptz 컬럼과 gte/lt 비교용)
export function getAppDayRange(dateStr: string = getAppToday()): {
  start: string;
  end: string;
} {
  const utcMidnight = new Date(`${dateStr}T00:00:00.000Z`).getTime();
  const start = new Date(
    utcMidnight + (CUTOFF_HOUR * 60 - APP_TZ_OFFSET_MINUTES) * MS_PER_MINUTE,
  );
  const end = new Date(start.getTime() + MS_PER_DAY);
  return { start: start.toISOString(), end: end.toISOString() };
}
