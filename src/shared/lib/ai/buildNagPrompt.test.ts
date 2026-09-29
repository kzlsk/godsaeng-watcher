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

  it("loads the sentence-structure diversity instruction from every persona file", () => {
    for (const personaId of ["realist", "furious-boss", "clingy-friend"] as const) {
      const { system } = buildNagPrompt({ ...BASE_CONTEXT, personaId });
      expect(system).toMatch(/## 문장 구조 다양성/);
      expect(system).toMatch(/매번 다른 문장 구조로 말한다/);
    }
  });

  it("adds a per-request focus hint and structure hint to the system prompt", () => {
    const { system, variety } = buildNagPrompt(FULL_CONTEXT);

    expect(system).toMatch(/## 이번 요청의 방향/);
    expect(system).toMatch(/이번엔 특히 .+을 중심으로 지적해줘/);
    expect(system).toContain(variety.structureHint);
  });

  it("puts the focused data first in the user prompt", () => {
    for (let i = 0; i < 50; i += 1) {
      const { user, variety } = buildNagPrompt(FULL_CONTEXT);
      const firstLine = user.split("\n")[0];
      expect(firstLine).toMatch(FOCUS_LINE_PATTERNS[variety.focusKeys[0]]);
    }
  });

  it("still ends the user prompt with the one-sentence instruction and keeps every data line", () => {
    const { user } = buildNagPrompt(FULL_CONTEXT, { random: seeded(7) });
    const lines = user.split("\n");

    expect(lines.at(-1)).toBe("위 데이터를 근거로 쓴소리를 한 문장으로 던져줘.");
    expect(lines).toHaveLength(8);
    for (const pattern of Object.values(FOCUS_LINE_PATTERNS)) {
      expect(lines.some((line) => pattern.test(line))).toBe(true);
    }
  });

  it("동일한 입력으로 5번 재생성하면 초점·문장 구조·데이터 순서가 2가지 이상 패턴으로 나뉜다", () => {
    const random = seeded(2026);
    const runs = Array.from({ length: 5 }, () => buildNagPrompt(FULL_CONTEXT, { random }));

    const patterns = new Set(runs.map((run) => `${run.variety.focusKeys.join("+")}|${run.variety.structureHint}`));
    const structureHints = new Set(runs.map((run) => run.variety.structureHint));
    const dataOrders = new Set(runs.map((run) => run.user));

    expect(patterns.size).toBeGreaterThanOrEqual(3);
    expect(structureHints.size).toBeGreaterThanOrEqual(2);
    expect(dataOrders.size).toBeGreaterThanOrEqual(2);
  });

  it("완료율→집중시간 순서로 고정되지 않는다 (동일 입력 반복 시 첫 줄이 바뀐다)", () => {
    const firstLines = new Set(Array.from({ length: 100 }, () => buildNagPrompt(FULL_CONTEXT).user.split("\n")[0]));

    expect(firstLines.size).toBeGreaterThanOrEqual(3);
    expect([...firstLines].some((line) => !/완료율/.test(line))).toBe(true);
  });
});

describe("buildNagPrompt — 2차 다양성 (길이·종결어미·realist 전용 풀)", () => {
  it("uses the realist-only hint pool for realist and the common pool for others", () => {
    const realistHints = new Set(
      Array.from({ length: 300 }, () => buildNagPrompt({ ...FULL_CONTEXT, personaId: "realist" }).variety.structureHint),
    );
    const bossHints = new Set(
      Array.from({ length: 300 }, () => buildNagPrompt({ ...FULL_CONTEXT, personaId: "furious-boss" }).variety.structureHint),
    );

    expect([...realistHints].some((hint) => /결론을 먼저/.test(hint))).toBe(true);
    expect([...realistHints].some((hint) => /감탄사나 짧은 외마디/.test(hint))).toBe(false);
    expect([...bossHints].some((hint) => /감탄사나 짧은 외마디/.test(hint))).toBe(true);
    expect(realistHints.size).toBeGreaterThanOrEqual(6);
  });

  it("adds a strong one-number length rule only when the [short] hint is picked", () => {
    const runs = Array.from({ length: 200 }, () => buildNagPrompt(FULL_CONTEXT));
    const shortRuns = runs.filter((run) => run.variety.short);
    const longRuns = runs.filter((run) => !run.variety.short);

    expect(shortRuns.length).toBeGreaterThan(0);
    for (const run of shortRuns) {
      expect(run.system).toMatch(/길이 규칙\(다른 지시보다 우선\): 15자 내외/);
      expect(run.system).toMatch(/숫자는 딱 하나만/);
    }
    for (const run of longRuns) {
      expect(run.system).not.toMatch(/길이 규칙/);
    }
  });

  it("injects one of the persona's ending expressions unless the hint decides the ending itself", () => {
    const runs = Array.from({ length: 100 }, () => buildNagPrompt({ ...FULL_CONTEXT, personaId: "clingy-friend" }));
    const endings = new Set(runs.map((run) => run.variety.ending).filter(Boolean));

    expect(endings.size).toBeGreaterThanOrEqual(5);
    for (const run of runs) {
      if (run.variety.ending) expect(run.system).toContain(`이번엔 ${run.variety.ending} 계열의 어미로`);
      else expect(run.system).not.toMatch(/- 종결 표현:/);
    }
  });

  it("success 모드에는 쓴소리용 종결 표현을 주입하지 않는다", () => {
    for (let i = 0; i < 100; i += 1) {
      const { system, variety } = buildNagPrompt({
        ...FULL_CONTEXT,
        mode: "success",
        completedCount: 4,
        totalCount: 4,
        pendingMissionTitles: [],
      });
      expect(variety.ending).toBeUndefined();
      expect(system).not.toMatch(/- 종결 표현:/);
    }
  });

  it("forbids splitting the comment into several sentences", () => {
    expect(buildNagPrompt(BASE_CONTEXT).system).toMatch(/두 문장 이상 만들지 마/);
  });

  it("avoids the previous structure hint and ending when asked", () => {
    const first = buildNagPrompt(FULL_CONTEXT, { random: seeded(1) });
    for (let i = 0; i < 50; i += 1) {
      const next = buildNagPrompt(FULL_CONTEXT, {
        avoid: { structureHint: first.variety.structureHint, ending: first.variety.ending },
      });
      expect(next.variety.structureHint).not.toBe(first.variety.structureHint);
      if (first.variety.ending) expect(next.variety.ending).not.toBe(first.variety.ending);
    }
  });

  it("동일 입력 5회 재생성 시 짧은 힌트와 긴 힌트가 섞이고 종결 표현이 3가지 이상 갈린다 (시드 고정)", () => {
    const random = seeded(42);
    const runs: ReturnType<typeof buildNagPrompt>[] = [];
    for (let i = 0; i < 5; i += 1) {
      const previous = runs.at(-1)?.variety;
      runs.push(
        buildNagPrompt(FULL_CONTEXT, {
          random,
          avoid: { structureHint: previous?.structureHint, ending: previous?.ending },
        }),
      );
    }

    expect(runs.some((run) => run.variety.short)).toBe(true);
    expect(runs.some((run) => !run.variety.short)).toBe(true);
    expect(new Set(runs.map((run) => run.variety.ending ?? "(힌트가 끝맺음 결정)")).size).toBeGreaterThanOrEqual(3);
    expect(new Set(runs.map((run) => run.variety.structureHint)).size).toBeGreaterThanOrEqual(3);
  });
});

describe("buildNagPrompt — 미완료 미션 구체적 지적", () => {
  const NOW = new Date("2026-09-29T12:00:00.000Z");

  it('lists pending missions as "미완료 미션: [..], [..]" and tells the model to call one out', () => {
    const { system, user } = buildNagPrompt(
      {
        ...BASE_CONTEXT,
        pendingMissions: [
          { title: "이분 탐색 2문제", topic: "코테", deadline: "2026-09-29T08:00:00.000Z" },
          { title: "회고 쓰기", topic: null, deadline: null },
        ],
      },
      { now: NOW },
    );

    expect(user).toMatch(/^미완료 미션: \[코테 - 이분 탐색 2문제 \(마감 지남\)\], \[회고 쓰기\]$/m);
    expect(system).toMatch(/## 구체적 지적/);
    expect(system).toMatch(/그 이름을 문장에 자연스럽게 넣어 콕 집어 지적해/);
    expect(system).toMatch(/이미 끝낸 미션은 절대 언급하지 마/);
    expect(system).toMatch(/미션 이름으로 문장을 시작하지 마/);
  });

  it("falls back to pendingMissionTitles when pendingMissions is not given", () => {
    const { user } = buildNagPrompt(BASE_CONTEXT);
    expect(user).toMatch(/^미완료 미션: \[코딩 테스트\], \[회고 쓰기\]$/m);
  });

  it("trims to the 2 most urgent missions when there are more than 5", () => {
    const pendingMissions = [
      { title: "A", deadline: null },
      { title: "B", deadline: "2026-10-03T00:00:00.000Z" },
      { title: "C", deadline: "2026-09-29T10:00:00.000Z" },
      { title: "D", deadline: "2026-10-02T00:00:00.000Z" },
      { title: "E", deadline: "2026-09-30T00:00:00.000Z" },
      { title: "F", deadline: null },
    ];
    const { user, missions } = buildNagPrompt({ ...BASE_CONTEXT, pendingMissions }, { now: NOW });

    expect(missions.map((mission) => mission.title)).toEqual(["C", "E"]);
    expect(user).toMatch(/^미완료 미션 \(총 6개 중 마감 임박 2개\): \[C \(마감 지남\)\], \[E\]$/m);
    expect(user).not.toMatch(/\[A\]|\[B\]|\[D\]|\[F\]/);
  });

  it("미션이 하나도 없으면 미션 줄과 구체적 지적 지시를 넣지 않고 기존처럼 동작한다", () => {
    const { system, user, variety } = buildNagPrompt({
      ...BASE_CONTEXT,
      completedCount: 0,
      totalCount: 0,
      pendingMissionTitles: [],
      pendingMissions: [],
    });

    expect(user).not.toMatch(/미완료 미션/);
    expect(system).not.toMatch(/## 구체적 지적/);
    expect(user).toMatch(/완료율: 0\/0 \(0%\)/);
    expect(user.split("\n").at(-1)).toBe("위 데이터를 근거로 쓴소리를 한 문장으로 던져줘.");
    expect(variety.structureHint).not.toMatch(/미완료 미션 이름으로/);
  });

  it("전부 완료(success)면 미션 목록·지적 지시 없이 칭찬 프롬프트만 만든다", () => {
    const { system, user } = buildNagPrompt({
      ...BASE_CONTEXT,
      mode: "success",
      completedCount: 2,
      totalCount: 2,
      pendingMissionTitles: [],
      pendingMissions: [],
    });

    expect(user).not.toMatch(/미완료 미션/);
    expect(system).not.toMatch(/## 구체적 지적/);
    expect(user.split("\n").at(-1)).toBe("위 데이터를 근거로 칭찬 코멘트를 한 문장으로 던져줘.");
  });

  it("realist never gets the mission-first hint when there are no pending missions", () => {
    for (let i = 0; i < 200; i += 1) {
      const { variety } = buildNagPrompt({ ...BASE_CONTEXT, personaId: "realist", pendingMissionTitles: [] });
      expect(variety.structureHint).not.toMatch(/미완료 미션 이름으로/);
    }
  });
});

const FULL_CONTEXT: NagPromptContext = {
  ...BASE_CONTEXT,
  deadlineOverCount: 2,
  focusMinutesToday: 15,
  focusMinutesWeek: 120,
  currentStreak: 3,
};

const FOCUS_LINE_PATTERNS = {
  completion: /^오늘 미션 완료율:/,
  focusTime: /^오늘 집중 시간:/,
  streak: /^현재 스트릭:/,
  deadline: /^마감 초과 건수:/,
} as const;

// mulberry32 — 테스트를 결정적으로 만들기 위한 시드 기반 난수
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
