// 실제 OpenAI 호출로 고정 시나리오의 톤을 확인한다. 비용이 들고 키가 필요하므로 기본 테스트에서는 건너뛴다.
// 실행: RUN_LIVE_SCENARIOS=1 npx vitest run scenarios/nagScenarios.live.test.ts
// 결과는 LIVE_SCENARIO_OUT 경로(없으면 콘솔)에 마크다운 표로 남긴다. 폴백으로 대체하지 않고 실패는 그대로 드러낸다.
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { NAG_PERSONAS, type NagPersonaId } from "@/shared/config/personas";
import { buildNagPrompt } from "@/shared/lib/ai/buildNagPrompt";
import { INTENSITY_SAMPLES, NAG_SCENARIOS, SCENARIO_NOW, type NagScenario } from "./nagScenarios";

const LIVE = process.env.RUN_LIVE_SCENARIOS === "1";
const SAME_BAND_INTENSITY = 60;
const SWEEP_SCENARIO_ID = "progress-50-focus-69";

function loadApiKey(): string | undefined {
  if (!process.env.OPENAI_API_KEY && fs.existsSync(".env.local")) {
    process.loadEnvFile(".env.local");
  }
  return process.env.OPENAI_API_KEY;
}

async function generate(scenario: NagScenario, personaId: NagPersonaId, intensity: number, apiKey: string) {
  const { system, user } = buildNagPrompt({ ...scenario.input, personaId, intensity }, { now: SCENARIO_NOW });
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 120,
      temperature: 0.9,
    }),
  });
  if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
  const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
  return (data.choices?.[0]?.message?.content ?? "").split("\n")[0].trim();
}

describe.skipIf(!LIVE)("scenarios: live OpenAI output", () => {
  it(
    "generates quotes for every persona across situations and intensity bands",
    async () => {
      const apiKey = loadApiKey();
      expect(apiKey, "OPENAI_API_KEY가 없음").toBeTruthy();

      const sweepScenario = NAG_SCENARIOS.find((scenario) => scenario.id === SWEEP_SCENARIO_ID)!;
      const sections = await Promise.all(
        NAG_PERSONAS.map(async (persona) => {
          const sameBand = await Promise.all(
            NAG_SCENARIOS.map(async (scenario) => {
              const quote = await generate(scenario, persona.id, SAME_BAND_INTENSITY, apiKey!);
              return `| ${scenario.label} | ${SAME_BAND_INTENSITY} | ${quote} |`;
            }),
          );
          const sweep = await Promise.all(
            INTENSITY_SAMPLES.map(async (intensity) => {
              const quote = await generate(sweepScenario, persona.id, intensity, apiKey!);
              return `| ${sweepScenario.label} | ${intensity} | ${quote} |`;
            }),
          );
          const rows = [...sameBand, ...sweep];
          for (const row of rows) expect(row).not.toMatch(/\|\s*\|$/);
          return [`### ${persona.name} (${persona.id})`, "", "| 상황 | 강도 | 생성 문구 |", "| --- | --- | --- |", ...rows].join("\n");
        }),
      );

      const report = sections.join("\n\n");
      if (process.env.LIVE_SCENARIO_OUT) fs.writeFileSync(process.env.LIVE_SCENARIO_OUT, report, "utf-8");
      else console.log(report);
    },
    300_000,
  );
});
