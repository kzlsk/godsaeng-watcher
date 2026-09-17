import { describe, expect, it } from "vitest";
import { buildAddMissionPayload } from "@/features/add-mission/model/buildAddMissionPayload";

describe("buildAddMissionPayload", () => {
  it("deadline이 있으면 ISO timestamptz로 변환해서 포함한다", () => {
    const now = new Date(2024, 0, 15, 9, 0, 0);
    const payload = buildAddMissionPayload(
      { topic: "코테", todo: "2문제", deadline: "13:00", isImportant: false },
      now,
    );

    expect(payload).toHaveProperty("deadline");
    expect(new Date((payload as { deadline: string }).deadline).getHours()).toBe(13);
  });

  it("deadline이 빈 문자열이면 payload에 deadline 필드 자체가 없다", () => {
    const payload = buildAddMissionPayload({ topic: "코테", todo: "2문제", deadline: "", isImportant: false });

    expect(payload).not.toHaveProperty("deadline");
    expect(payload).toEqual({ topic: "코테", todo: "2문제", isImportant: false });
  });

  it("deadline이 undefined이면 payload에 deadline 필드 자체가 없다", () => {
    const payload = buildAddMissionPayload({ topic: "코테", todo: "2문제", isImportant: true });

    expect(payload).not.toHaveProperty("deadline");
    expect(payload).toEqual({ topic: "코테", todo: "2문제", isImportant: true });
  });
});
