import { describe, expect, it } from "vitest";
import {
  describeFocus,
  listFocusCandidates,
  pickFocusKeys,
  pickNagVariety,
  pickStructureHint,
  shuffle,
  SHORT_HINT_PROBABILITY,
  type RandomFn,
} from "./nagVariety";
import type { StructureHint } from "./structureHints";

function hint(text: string, tags: Partial<Omit<StructureHint, "text">> = {}): StructureHint {
  return { text, short: false, ends: false, mission: false, ...tags };
}

const HINTS: StructureHint[] = [
  hint("짧게", { short: true }),
  hint("질문으로 끝내", { ends: true }),
  hint("미션 이름으로 시작", { mission: true }),
  hint("비유"),
  hint("숫자로 시작"),
];
const ENDINGS = ["~네", "~잖아", "~인 거지", "~다", "~는데?"];

function sequence(values: number[]): RandomFn {
  let index = 0;
  return () => values[index++ % values.length];
}

describe("listFocusCandidates", () => {
  it("includes every element when all data is available in fail mode", () => {
    expect(
      listFocusCandidates({ mode: "fail", deadlineOverCount: 2, focusMinutesToday: 30, currentStreak: 3 }).sort(),
    ).toEqual(["completion", "deadline", "focusTime", "streak"]);
  });

  it("drops deadline when nothing is overdue, and in success mode", () => {
    expect(listFocusCandidates({ mode: "fail", deadlineOverCount: 0 })).toEqual(["completion"]);
    expect(listFocusCandidates({ mode: "success", deadlineOverCount: 3, focusMinutesToday: 10 })).toEqual([
      "completion",
      "focusTime",
    ]);
  });
});

describe("pickFocusKeys", () => {
  const input = { mode: "fail" as const, deadlineOverCount: 1, focusMinutesToday: 20, currentStreak: 5 };

  it("picks one or two distinct keys from the candidates", () => {
    for (let i = 0; i < 200; i += 1) {
      const keys = pickFocusKeys(input);
      expect(keys.length).toBeGreaterThanOrEqual(1);
      expect(keys.length).toBeLessThanOrEqual(2);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it("does not always lead with completion rate", () => {
    const leads = new Set(Array.from({ length: 200 }, () => pickFocusKeys(input)[0]));
    expect(leads).toEqual(new Set(["completion", "focusTime", "streak", "deadline"]));
  });

  it("is safe when random returns values at the edge (0 and just below 1)", () => {
    expect(pickFocusKeys(input, () => 0)).toHaveLength(2);
    expect(pickFocusKeys(input, () => 0.9999999)).toHaveLength(1);
  });
});

describe("shuffle", () => {
  it("keeps all elements without mutating the input", () => {
    const source = [1, 2, 3, 4, 5];
    const result = shuffle(source, sequence([0.1, 0.9, 0.5, 0.3]));
    expect(source).toEqual([1, 2, 3, 4, 5]);
    expect([...result].sort()).toEqual(source);
  });
});

describe("describeFocus", () => {
  it("uses a scolding verb in fail mode and a praising verb in success mode", () => {
    expect(describeFocus("fail", ["focusTime"])).toMatch(/집중 시간이 부족하다는 점을 중심으로 지적해줘/);
    expect(describeFocus("success", ["streak"])).toMatch(/스트릭.*을 중심으로 칭찬해줘/);
  });

  it("joins two focus subjects", () => {
    expect(describeFocus("fail", ["deadline", "streak"])).toMatch(/마감을 넘긴 미션.*, 그리고 스트릭/);
  });
});

describe("pickStructureHint", () => {
  it("picks the [short] hint with roughly SHORT_HINT_PROBABILITY", () => {
    const draws = 4000;
    let shortCount = 0;
    for (let i = 0; i < draws; i += 1) {
      if (pickStructureHint(HINTS, { hasPendingMissions: true })?.short) shortCount += 1;
    }
    expect(shortCount / draws).toBeGreaterThan(SHORT_HINT_PROBABILITY - 0.05);
    expect(shortCount / draws).toBeLessThan(SHORT_HINT_PROBABILITY + 0.05);
  });

  it("excludes [mission] hints when there are no pending missions", () => {
    for (let i = 0; i < 300; i += 1) {
      expect(pickStructureHint(HINTS, { hasPendingMissions: false })?.mission).toBe(false);
    }
  });

  it("never repeats the previous hint", () => {
    for (let i = 0; i < 300; i += 1) {
      expect(pickStructureHint(HINTS, { hasPendingMissions: true, avoid: "비유" })?.text).not.toBe("비유");
    }
  });

  it("still returns the only hint even if it was the previous one", () => {
    expect(pickStructureHint([hint("유일")], { hasPendingMissions: false, avoid: "유일" })?.text).toBe("유일");
  });
});

describe("pickNagVariety", () => {
  const pools = { hints: HINTS, endings: ENDINGS };

  it("covers every hint and every ending over many draws", () => {
    const draws = Array.from({ length: 600 }, () => pickNagVariety({ mode: "fail", hasPendingMissions: true }, pools));
    expect(new Set(draws.map((draw) => draw.structureHint))).toEqual(new Set(HINTS.map((item) => item.text)));
    expect(new Set(draws.map((draw) => draw.ending).filter(Boolean))).toEqual(new Set(ENDINGS));
  });

  it("omits the ending directive when an [ends] hint is picked", () => {
    const draws = Array.from({ length: 300 }, () => pickNagVariety({ mode: "fail" }, pools));
    for (const draw of draws.filter((item) => item.structureHint === "질문으로 끝내")) {
      expect(draw.ending).toBeUndefined();
    }
  });

  it("avoids the previous ending", () => {
    for (let i = 0; i < 300; i += 1) {
      expect(pickNagVariety({ mode: "fail" }, pools, Math.random, { ending: "~네" }).ending).not.toBe("~네");
    }
  });
});
