export interface StreakSummary {
  // 어제까지의 확정된 연속일수(오늘 이미 체크인했다면 오늘 포함, 아니면 어제까지만).
  currentStreak: number;
  weeklyScore: number;
  weeklyScoreDelta: number;
  last7Days: boolean[];
  // app/api/streak/route.ts(스코프 밖)가 아직 채우지 않을 수 있어 optional로 둔다.
  // true면 오늘 아직 체크인/완료 전이라는 뜻 — "오늘 완료 시 potentialStreak일" 안내에 쓴다.
  isTodayPending?: boolean;
  potentialStreak?: number;
}
