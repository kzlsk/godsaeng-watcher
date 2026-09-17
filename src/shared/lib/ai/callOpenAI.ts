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
  const history = Array.from(
    new Set([...(context.recentQuotes ?? []), ...getRecentQuotes(context.mode, context.personaId)]),
  );

  if (!apiKey) {
    const fallback = pickFallbackMessage(context.mode, context.personaId, history);
    recordQuote(context.mode, context.personaId, fallback);
    return fallback;
  }

  const { system, user } = buildNagPrompt(context, { recentQuotes: history });

  try {
    const text = await requestOpenAI(system, user, apiKey);
    if (!text || history.includes(text)) {
      throw new Error("empty or duplicate OpenAI response");
    }

    recordQuote(context.mode, context.personaId, text);
    return text;
  } catch {
    const fallback = pickFallbackMessage(context.mode, context.personaId, history);
    recordQuote(context.mode, context.personaId, fallback);
    return fallback;
  }
}
