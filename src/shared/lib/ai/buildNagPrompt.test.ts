import { describe, expect, it } from "vitest";
import { buildNagPrompt, type NagPromptContext } from "./buildNagPrompt";

const BASE_CONTEXT: NagPromptContext = {
  mode: "fail",
  personaId: "realist",
  completedCount: 1,
  totalCount: 4,
  delayMinutesToday: 47,
  pendingMissionTitles: ["코딩 테스트", "회고 쓰기"],
};

describe("buildNagPrompt", () => {
  it("loads the persona-specific system prompt from prompts/personas/*.md", () => {
    const { system } = buildNagPrompt(BASE_CONTEXT);

    expect(system).toMatch(/현실주의 팩폭러/);
    expect(system).toMatch(/갓생 감시자/);
  });

  it("scales tone directives by intensity (30 vs 90 differ)", () => {
    const low = buildNagPrompt({ ...BASE_CONTEXT, intensity: 30 });
    const high = buildNagPrompt({ ...BASE_CONTEXT, intensity: 90 });

    expect(low.system).not.toBe(high.system);
    expect(low.system).toMatch(/절제한다/);
    expect(high.system).toMatch(/최대치로 드러낸다/);
  });

  it("always carries the intensity-independent safety rules", () => {
    for (const intensity of [0, 30, 50, 90, 100]) {
      const { system } = buildNagPrompt({ ...BASE_CONTEXT, intensity });
      expect(system).toMatch(/욕설, 비속어, 인신공격/);
    }
  });

  it("embeds today's completion rate, deadline overrun count, focus time, and streak", () => {
    const { user } = buildNagPrompt({
      ...BASE_CONTEXT,
      deadlineOverCount: 2,
      focusMinutesToday: 90,
      focusMinutesWeek: 420,
      currentStreak: 12,
    });

    expect(user).toMatch(/완료율: 1\/4 \(25%\)/);
    expect(user).toMatch(/마감 초과 건수: 2건/);
    expect(user).toMatch(/오늘 집중 시간: 90분/);
    expect(user).toMatch(/이번 주 누적 집중 시간: 420분/);
    expect(user).toMatch(/현재 스트릭: 12일/);
  });

  it("instructs the model to avoid recent quotes on regeneration", () => {
    const withoutHistory = buildNagPrompt(BASE_CONTEXT);
    const withHistory = buildNagPrompt({
      ...BASE_CONTEXT,
      recentQuotes: ["계획을 세운 게 아니라 희망을 적어둔 거였네."],
    });

    expect(withoutHistory.system).not.toMatch(/반복 금지/);
    expect(withHistory.system).toMatch(/반복 금지/);
    expect(withHistory.system).toMatch(/계획을 세운 게 아니라 희망을 적어둔 거였네\./);
  });
});
