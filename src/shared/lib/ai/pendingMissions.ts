// 쓴소리에 실제 미션 이름을 넣어 "코테 아직이네" 같은 구체적 지적이 가능하도록,
// 미완료 미션을 프롬프트용으로 추리고 표시 문자열로 만든다.

export interface NagPendingMission {
  /** missions.title (UI의 todo) */
  title: string;
  /** missions.category (UI의 topic) */
  topic?: string | null;
  deadline?: string | null;
  urgent?: boolean | null;
}

/** 이 개수를 넘으면 프롬프트가 산만해지므로 마감 임박순으로 추린다 */
export const MAX_MISSIONS_IN_PROMPT = 5;
export const TRIMMED_MISSION_COUNT = 2;

function deadlineTime(mission: NagPendingMission): number {
  if (!mission.deadline) return Number.POSITIVE_INFINITY;
  const time = new Date(mission.deadline).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

// 마감이 빠른 순(이미 지난 마감이 가장 앞) → 같으면 긴급 표시 우선 → 마감 없는 미션은 뒤.
function byUrgency(a: NagPendingMission, b: NagPendingMission): number {
  const diff = deadlineTime(a) - deadlineTime(b);
  if (diff !== 0 && !Number.isNaN(diff)) return diff;
  return Number(Boolean(b.urgent)) - Number(Boolean(a.urgent));
}

export function selectMissionsForPrompt(missions: NagPendingMission[]): NagPendingMission[] {
  const valid = missions.filter((mission) => mission.title.trim().length > 0);
  if (valid.length <= MAX_MISSIONS_IN_PROMPT) return valid;
  return [...valid].sort(byUrgency).slice(0, TRIMMED_MISSION_COUNT);
}

export function formatMissionLabel(mission: NagPendingMission, now: Date): string {
  const topic = mission.topic?.trim();
  const name = topic ? `${topic} - ${mission.title.trim()}` : mission.title.trim();
  const overdue = deadlineTime(mission) < now.getTime();
  return `[${name}${overdue ? " (마감 지남)" : ""}]`;
}
