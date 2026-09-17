import { describe, expect, it } from "vitest";
import { isQualifyingCheckin } from "./checkinQualifies";

describe("isQualifyingCheckin", () => {
  it("applications가 0보다 크면 인정한다", () => {
    expect(isQualifyingCheckin({ applications: 1, problems: 0 })).toBe(true);
  });

  it("problems가 0보다 크면 인정한다", () => {
    expect(isQualifyingCheckin({ applications: 0, problems: 1 })).toBe(true);
  });

  it("둘 다 0이면 인정하지 않는다", () => {
    expect(isQualifyingCheckin({ applications: 0, problems: 0 })).toBe(false);
  });

  it("둘 다 null이면 인정하지 않는다", () => {
    expect(isQualifyingCheckin({ applications: null, problems: null })).toBe(false);
  });
});
