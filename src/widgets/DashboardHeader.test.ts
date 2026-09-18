import { describe, expect, it } from "vitest";
import { formatAppDate } from "./DashboardHeader";

describe("formatAppDate", () => {
  it("YYYY-MM-DD 문자열을 'M월 D일 요일' 형태로 포맷한다", () => {
    expect(formatAppDate("2026-09-17")).toBe("9월 17일 목");
  });

  it("서버 로컬 타임존과 무관하게(UTC getter 기준) 같은 결과를 낸다", () => {
    // 문자열 자체가 이미 확정된 날짜이므로, 로컬 TZ가 어디든 같은 결과여야 한다.
    expect(formatAppDate("2026-01-01")).toBe("1월 1일 목");
  });
});
