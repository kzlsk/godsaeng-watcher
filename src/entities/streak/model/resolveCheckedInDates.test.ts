import { describe, expect, it } from "vitest";
import { resolveCheckedInDates } from "./resolveCheckedInDates";

describe("resolveCheckedInDates", () => {
  it("applications/problems가 있는 체크인 날짜만 뽑는다", () => {
    const dates = resolveCheckedInDates(
      [
        { date: "2026-09-17", applications: 2, problems: 0 },
        { date: "2026-09-16", applications: 0, problems: 0 },
      ],
      [],
    );

    expect(dates).toEqual(["2026-09-17"]);
  });

  it("완료된 미션의 생성일도 체크인 날짜로 합친다", () => {
    const dates = resolveCheckedInDates([], ["2026-09-17T09:00:00.000Z", "2026-09-16T08:30:00.000Z"]);

    expect(dates).toEqual(["2026-09-17", "2026-09-16"]);
  });

  it("체크인과 미션 완료 날짜를 모두 합친다(중복 제거는 호출부의 Set 처리에 위임)", () => {
    const dates = resolveCheckedInDates(
      [{ date: "2026-09-17", applications: 1, problems: 0 }],
      ["2026-09-17T09:00:00.000Z"],
    );

    expect(dates).toEqual(["2026-09-17", "2026-09-17"]);
  });
});
