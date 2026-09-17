import { describe, expect, it } from "vitest";
import { buildLast7Days } from "./buildLast7Days";

describe("buildLast7Days", () => {
  it("오늘이 마지막 원소가 되도록 최근 7일 체크인 여부를 반환한다", () => {
    const days = buildLast7Days(["2026-09-17", "2026-09-15"], "2026-09-17");

    expect(days).toEqual([false, false, false, false, true, false, true]);
    // index: 09-11 09-12  09-13  09-14  09-15 09-16 09-17
  });

  it("체크인이 하나도 없으면 전부 false다", () => {
    expect(buildLast7Days([], "2026-09-17")).toEqual([false, false, false, false, false, false, false]);
  });

  it("항상 길이 7을 반환한다", () => {
    expect(buildLast7Days(["2026-09-17"], "2026-09-17")).toHaveLength(7);
  });
});
