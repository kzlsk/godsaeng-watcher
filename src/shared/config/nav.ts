/*
 * 모바일 하단 탭이 스크롤해 갈 대시보드 섹션 앵커.
 * 값은 app/(dashboard)/page.tsx의 <section id={...}>와 1:1로 대응한다.
 */
export const NAV_SECTION_IDS = {
  stats: "section-stats",
  timer: "section-timer",
  missions: "section-missions",
} as const;

export interface MobileNavItem {
  readonly id: string;
  readonly label: string;
  /** 이 탭이 가리키는 섹션 앵커 id */
  readonly sectionId: string;
}

export const MOBILE_NAV_ITEMS: readonly MobileNavItem[] = [
  { id: "stats", label: "통계", sectionId: NAV_SECTION_IDS.stats },
  { id: "timer", label: "타이머", sectionId: NAV_SECTION_IDS.timer },
  { id: "missions", label: "미션", sectionId: NAV_SECTION_IDS.missions },
];

// 섹션이 뷰포트 맨 위에 딱 붙지 않도록 남겨두는 여백(px).
export const NAV_SCROLL_MARGIN = 12;

/*
 * 활성 탭 판정선 — "화면 위에서 이만큼 내려온 지점에 걸친 섹션"을 현재 섹션으로 본다.
 * NAV_SCROLL_MARGIN보다 커야 한다. 탭을 눌러 스크롤이 끝난 순간 그 섹션의 top은
 * 화면 위에서 정확히 NAV_SCROLL_MARGIN만큼 아래에 있는데, 판정선이 그보다 위면
 * 방금 누른 탭이 활성으로 잡히지 않기 때문이다.
 */
export const NAV_ACTIVE_OFFSET = NAV_SCROLL_MARGIN + 8;

// 뷰포트 기준 위치(getBoundingClientRect().top)를 문서 기준 스크롤 위치로 바꾼다.
// 문서 맨 위를 넘어가는 음수 값은 0으로 자른다.
export function computeNavScrollTop(
  rectTop: number,
  scrollY: number,
  margin: number = NAV_SCROLL_MARGIN,
): number {
  return Math.max(0, Math.round(rectTop + scrollY - margin));
}

export interface NavSectionPosition {
  /** 탭 id */
  readonly id: string;
  /** 섹션의 문서 기준 top (= rect.top + scrollY) */
  readonly top: number;
}

/*
 * 지금 스크롤 위치에서 어떤 탭이 활성인지 고른다.
 * - 판정선(scrollY + NAV_ACTIVE_OFFSET)보다 위에서 시작한 섹션들 중 "마지막" 것
 * - 첫 섹션보다 더 위로 올라가 있으면 첫 번째 탭 (예: 쓴소리 배너를 보고 있을 때 = 통계)
 * - 문서 끝에 닿았으면 마지막 탭 — 마지막 섹션이 짧아서 화면 위까지 올라오지 못해도
 *   스크롤을 끝까지 내렸으면 그 섹션을 보고 있는 것이기 때문
 *
 * 모바일에서는 CSS order로 화면 순서가 바뀌므로 DOM 순서가 아니라 실제 top으로 정렬한다.
 */
export function resolveActiveNavId(
  sections: readonly NavSectionPosition[],
  scrollY: number,
  isAtBottom = false,
): string | null {
  if (sections.length === 0) return null;

  const sorted = [...sections].sort((a, b) => a.top - b.top);
  if (isAtBottom) return sorted[sorted.length - 1].id;

  const line = scrollY + NAV_ACTIVE_OFFSET;
  let activeId = sorted[0].id;
  for (const section of sorted) {
    if (section.top > line) break;
    activeId = section.id;
  }
  return activeId;
}
