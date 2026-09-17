import { describe, expect, it } from "vitest";
import { toCheckinRecord } from "./mapCheckinRow";

describe("toCheckinRecord", () => {
  it("행 값을 그대로 CheckinRecord로 매핑한다", () => {
    const record = toCheckinRecord({ date: "2026-09-17", applications: 3, problems: 2 });

    expect(record).toEqual({ date: "2026-09-17", applications: 3, problems: 2 });
  });

  it("applications/problems가 null이면 0으로 fallback한다", () => {
    const record = toCheckinRecord({ date: "2026-09-17", applications: null, problems: null });

    expect(record.applications).toBe(0);
    expect(record.problems).toBe(0);
  });
});
