import { describe, expect, it } from "vitest";
import {
  MOBILE_NAV_ITEMS,
  NAV_ACTIVE_OFFSET,
  NAV_SCROLL_MARGIN,
  NAV_SECTION_IDS,
  computeNavScrollTop,
  resolveActiveNavId,
} from "./nav";

describe("computeNavScrollTop", () => {
  it("뷰포트 기준 위치를 문서 기준 위치로 바꾸고 여백만큼 당긴다", () => {
    expect(computeNavScrollTop(500, 120, 12)).toBe(608);
  });

  it("여백 기본값은 NAV_SCROLL_MARGIN이다", () => {
    expect(computeNavScrollTop(500, 120)).toBe(620 - NAV_SCROLL_MARGIN);
  });

  it("문서 맨 위를 넘어가는 음수는 0으로 자른다", () => {
    expect(computeNavScrollTop(-400, 0)).toBe(0);
  });
});

describe("MOBILE_NAV_ITEMS", () => {
  it("탭은 통계 / 타이머 / 미션 3개다", () => {
    expect(MOBILE_NAV_ITEMS.map((item) => item.id)).toEqual(["stats", "timer", "missions"]);
    expect(MOBILE_NAV_ITEMS.map((item) => item.label)).toEqual(["통계", "타이머", "미션"]);
  });

  it("모든 탭이 NAV_SECTION_IDS에 정의된 앵커를 가리킨다", () => {
    const known = Object.values(NAV_SECTION_IDS) as string[];
    for (const item of MOBILE_NAV_ITEMS) {
      expect(known).toContain(item.sectionId);
    }
  });

  it("앵커 id는 서로 겹치지 않는다", () => {
    const ids = Object.values(NAV_SECTION_IDS);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("resolveActiveNavId", () => {
  // 모바일 화면 순서(통계 → 타이머 → 미션) 기준 문서 좌표
  const sections = [
    { id: "stats", top: 400 },
    { id: "timer", top: 1200 },
    { id: "missions", top: 2000 },
  ];

  it("첫 섹션보다 위(쓴소리 배너를 보는 중)면 첫 탭이 활성이다", () => {
    expect(resolveActiveNavId(sections, 0)).toBe("stats");
    expect(resolveActiveNavId(sections, 200)).toBe("stats");
  });

  it("판정선을 지난 마지막 섹션이 활성이다", () => {
    expect(resolveActiveNavId(sections, 500)).toBe("stats");
    expect(resolveActiveNavId(sections, 1300)).toBe("timer");
    expect(resolveActiveNavId(sections, 2100)).toBe("missions");
  });

  it("탭을 눌러 스크롤이 끝난 지점에서 그 탭이 활성으로 잡힌다", () => {
    // 탭 클릭 시 scrollY = top - NAV_SCROLL_MARGIN 으로 이동한다.
    for (const section of sections) {
      expect(resolveActiveNavId(sections, section.top - NAV_SCROLL_MARGIN)).toBe(section.id);
    }
  });

  it("타이머까지 갔다가 위로 올라오면 다시 통계가 활성이다", () => {
    expect(resolveActiveNavId(sections, 1200 - NAV_SCROLL_MARGIN)).toBe("timer");
    expect(resolveActiveNavId(sections, 100)).toBe("stats");
  });

  it("문서 끝에 닿으면 마지막 섹션이 짧아도 마지막 탭이 활성이다", () => {
    expect(resolveActiveNavId(sections, 1500, true)).toBe("missions");
  });

  it("DOM 순서가 아니라 실제 화면 위치(top) 순서를 따른다", () => {
    const shuffled = [
      { id: "missions", top: 2000 },
      { id: "stats", top: 400 },
      { id: "timer", top: 1200 },
    ];
    expect(resolveActiveNavId(shuffled, 1300)).toBe("timer");
  });

  it("섹션을 하나도 못 찾으면 null이다", () => {
    expect(resolveActiveNavId([], 0)).toBeNull();
  });

  it("판정선은 스크롤 여백보다 커야 누른 탭이 활성으로 잡힌다", () => {
    expect(NAV_ACTIVE_OFFSET).toBeGreaterThanOrEqual(NAV_SCROLL_MARGIN);
  });
});
