export interface DeadlineTime {
  hour: number;
  minute: number;
}

// 이 화면에서 고를 수 있는 마지막 시각(23:50, 10분 단위의 마지막 마크). 이 값을 넘기면
// 다음 날로 롤오버되는데, 이 컴포넌트는 자정을 넘는 입력을 만들지 않는 것을 전제로 하므로
// 그 대신 이 값으로 고정한다.
const LAST_SELECTABLE_MINUTE_OF_DAY = 23 * 60 + 50;

/**
 * 현재 시각을 기준으로 다음 정각(:00) 또는 30분(:30) 단위로 기본 마감 시각을 계산한다.
 * 예: 14:37 -> 15:00, 14:05 -> 14:30, 14:30 -> 14:30(그대로 유지).
 * 자정을 넘기지 않도록 23:50을 넘는 값은 23:50으로 고정한다(다음 날로 롤오버하지 않음).
 */
export function computeDefaultDeadlineTime(now: Date = new Date()): DeadlineTime {
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const rounded = Math.ceil(totalMinutes / 30) * 30;
  const clamped = Math.min(rounded, LAST_SELECTABLE_MINUTE_OF_DAY);
  return { hour: Math.floor(clamped / 60), minute: clamped % 60 };
}
