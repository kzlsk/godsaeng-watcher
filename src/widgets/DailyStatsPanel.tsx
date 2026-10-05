"use client";

import { Panel } from "@/shared/ui/Card";
import { StatCell } from "@/shared/ui/StatCell";
import { useDailyStats } from "@/entities/checkin/model/useDailyStats";
import { useMissions } from "@/entities/mission/model/useMissions";
import { useStreak } from "@/entities/streak/model/useStreak";

/*
 * 원래 MissionBoard 안에 미션 목록과 같이 들어 있던 "오늘 통계" 4칸을 떼어낸 위젯이다.
 * 모바일에서 섹션 순서를 통계 → 스트릭 → 타이머 → 미션으로 바꾸려면 통계와 미션이 서로 다른
 * 위치에 놓여야 해서 분리했다(배치는 page.tsx가 결정한다).
 *
 * 칸 구분선:
 * - 모바일: 2열 x 2행 그리드라서 "1행 아래쪽"과 "왼쪽 칸 오른쪽"에만 선이 필요하다.
 *   그래서 칸마다 필요한 테두리를 className으로 넘긴다.
 * - sm 이상: 기존과 똑같이 한 줄 4칸 + 컨테이너의 divide-x-2 → 데스크톱 모습은 그대로다.
 *
 * StatCell(shared/ui)은 이번 스코프 밖이라 내부를 고치지 않고, 넘길 수 있는 className/ReactNode로만
 * 조정했다. 모바일 좌우 패딩은 max-sm: 변형으로 낮춘다 — 변형 없는 유틸끼리 겹치면
 * (StatCell 기본 px-4.5 vs 내가 준 px-3) 누가 이길지 Tailwind 정렬 순서에 달려 불안정하지만,
 * 미디어 변형은 항상 기본 유틸보다 뒤에 나오므로 확실히 이긴다.
 */
const CELL_BASE = "max-sm:px-3 max-sm:py-3.5";
// 1행 왼쪽 / 1행 오른쪽 / 2행 왼쪽 / 2행 오른쪽
const CELL_TOP_LEFT = `${CELL_BASE} border-b-2 border-r-2 sm:border-b-0`;
const CELL_TOP_RIGHT = `${CELL_BASE} border-b-2 sm:border-b-0`;
const CELL_BOTTOM_LEFT = `${CELL_BASE} border-r-2`;
const CELL_BOTTOM_RIGHT = CELL_BASE;

export function DailyStatsPanel() {
  const { data: missions = [] } = useMissions();
  const { data: stats } = useDailyStats();
  const { data: streak } = useStreak();

  const completedCount = missions.filter((mission) => mission.isCompleted).length;
  const totalCount = missions.length;
  const completionRate = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  return (
    <Panel className="grid w-full grid-cols-2 divide-border-soft sm:flex sm:flex-row sm:divide-x-2">
      <StatCell
        className={CELL_TOP_LEFT}
        label="오늘 완료율"
        value={`${completionRate}%`}
        caption={`${completedCount}/${totalCount}`}
      />
      <StatCell
        className={CELL_TOP_RIGHT}
        label="총 집중 시간"
        value={stats ? `${Math.floor(stats.totalFocusMinutes / 60)}h ${stats.totalFocusMinutes % 60}m` : "—"}
        caption={stats ? `예상보다 ${stats.focusAheadMinutes}분 빠름` : undefined}
      />
      <StatCell
        className={CELL_BOTTOM_LEFT}
        label="지연 누적"
        value={stats ? `${stats.delayMinutesToday}분` : "—"}
        caption={stats ? `이번 주 미룬 시간 ${stats.delayMinutesWeek}분` : undefined}
      />
      <StatCell
        className={CELL_BOTTOM_RIGHT}
        label="주간 점수"
        value={streak ? `${streak.weeklyScore}점` : "—"}
        valueTone="green"
        caption={streak ? `+${streak.weeklyScoreDelta} 지난주 대비` : undefined}
      />
    </Panel>
  );
}
