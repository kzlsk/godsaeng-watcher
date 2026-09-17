import { describe, expect, it } from "vitest";
import { getRecentQuotes, recordQuote } from "./nagHistory";

describe("nagHistory", () => {
  it("recordQuote/getRecentQuotes round-trips most-recent-first", () => {
    const mode = "fail" as const;
    const personaId = "realist" as const;

    recordQuote(mode, personaId, "첫 번째 문구");
    recordQuote(mode, personaId, "두 번째 문구");

    const history = getRecentQuotes(mode, personaId);
    expect(history.slice(0, 2)).toEqual(["두 번째 문구", "첫 번째 문구"]);
  });

  it("caps history so it doesn't grow unbounded", () => {
    const mode = "success" as const;
    const personaId = "clingy-friend" as const;

    for (let i = 0; i < 10; i += 1) {
      recordQuote(mode, personaId, `문구 ${i}`);
    }

    const history = getRecentQuotes(mode, personaId);
    expect(history.length).toBeLessThanOrEqual(5);
    expect(history[0]).toBe("문구 9");
  });

  it("isolates history per mode/personaId key", () => {
    recordQuote("fail", "furious-boss", "팀장 fail 문구");
    recordQuote("success", "furious-boss", "팀장 success 문구");

    expect(getRecentQuotes("fail", "furious-boss").slice(0, 1)).toEqual(["팀장 fail 문구"]);
    expect(getRecentQuotes("success", "furious-boss").slice(0, 1)).toEqual(["팀장 success 문구"]);
  });
});
