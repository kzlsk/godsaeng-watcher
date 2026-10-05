import { describe, expect, it } from "vitest";
import { describeAuthProvider, formatAppDate } from "./DashboardHeader";

describe("formatAppDate", () => {
  it("YYYY-MM-DD 문자열을 'M월 D일 요일' 형태로 포맷한다", () => {
    expect(formatAppDate("2026-09-17")).toBe("9월 17일 목");
  });

  it("서버 로컬 타임존과 무관하게(UTC getter 기준) 같은 결과를 낸다", () => {
    // 문자열 자체가 이미 확정된 날짜이므로, 로컬 TZ가 어디든 같은 결과여야 한다.
    expect(formatAppDate("2026-01-01")).toBe("1월 1일 목");
  });
});

describe("describeAuthProvider", () => {
  it("알려진 프로바이더는 한국어 라벨로 바꾼다", () => {
    expect(describeAuthProvider("kakao")).toBe("카카오");
    expect(describeAuthProvider("google")).toBe("구글");
    expect(describeAuthProvider("email")).toBe("이메일");
  });

  it("모르는 프로바이더는 원문을 그대로 보여준다", () => {
    expect(describeAuthProvider("github")).toBe("github");
  });

  it("값이 없으면 null이라 뱃지를 그리지 않는다", () => {
    expect(describeAuthProvider(null)).toBeNull();
    expect(describeAuthProvider(undefined)).toBeNull();
    expect(describeAuthProvider("")).toBeNull();
  });
});
