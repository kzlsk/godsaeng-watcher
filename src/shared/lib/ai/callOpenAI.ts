import type { NagPromptContext } from "@/shared/lib/ai/buildNagPrompt";
import { buildNagPrompt } from "@/shared/lib/ai/buildNagPrompt";
import { pickFallbackMessage } from "@/shared/lib/ai/fallbackMessages";
import { getRecentQuotes, recordQuote } from "@/shared/lib/ai/nagHistory";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 8000;

interface OpenAIChatResponse {
  choices?: { message?: { content?: string } }[];
}

function sanitizeQuote(raw: string): string {
  return raw
    .split("\n")[0]
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, "");
}

async function requestOpenAI(system: string, user: string, apiKey: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 120,
        temperature: 0.9,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = (await response.json()) as OpenAIChatResponse;
    return sanitizeQuote(data.choices?.[0]?.message?.content ?? "");
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateNagMessage(context: NagPromptContext): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const recentFromMemory = getRecentQuotes(context.mode, context.personaId);
  const history = Array.from(new Set([...(context.recentQuotes ?? []), ...recentFromMemory]));
  // "정말 연속으로 같은 문구가 나왔는지"만 판단할 때는 방금 실제로 내보낸 문구 하나와만
  // 비교한다. history(최대 5개)에는 과거에 폴백으로 대체된 문구도 섞여 들어가 있는데,
  // 폴백 풀은 페르소나·모드당 4개뿐이라 그 문구들과 통째로 비교하면 한 번 폴백이 섞이는
  // 순간부터 이후의 정상적인 새 OpenAI 응답까지 "중복"으로 오판해 계속 폴백으로 되돌리는
  // 악순환이 생긴다. history 전체는 prompt의 "반복 금지" 힌트(부드러운 유도)에만 쓴다.
  const lastQuote = recentFromMemory[0];

  if (!apiKey) {
    const fallback = pickFallbackMessage(context.mode, context.personaId, history);
    recordQuote(context.mode, context.personaId, fallback);
    return fallback;
  }

  const { system, user } = buildNagPrompt(context, { recentQuotes: history });

  try {
    const text = await requestOpenAI(system, user, apiKey);
    if (!text || text === lastQuote) {
      throw new Error("empty or duplicate OpenAI response");
    }

    recordQuote(context.mode, context.personaId, text);
    return text;
  } catch (error) {
    console.warn(
      "generateNagMessage: OpenAI 응답을 사용하지 못해 폴백 문구로 대체함:",
      error instanceof Error ? error.message : error,
    );
    const fallback = pickFallbackMessage(context.mode, context.personaId, history);
    recordQuote(context.mode, context.personaId, fallback);
    return fallback;
  }
}
