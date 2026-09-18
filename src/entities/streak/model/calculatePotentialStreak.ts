// currentStreak(어제까지의 확정값)에 "오늘 완료하면 될 값"을 더해 안내 문구용 숫자를 만든다.
// 오늘 이미 체크인했다면(isTodayPending=false) currentStreak 자체가 이미 오늘을 포함한
// 값이므로 그대로 반환한다.
export function calculatePotentialStreak(currentStreak: number, isTodayPending: boolean): number {
  return isTodayPending ? currentStreak + 1 : currentStreak;
}
