import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { NagPromptContext } from "@/shared/lib/ai/buildNagPrompt";
import { buildNagPrompt } from "@/shared/lib/ai/buildNagPrompt";
import { pickFallbackMessage } from "@/shared/lib/ai/fallbackMessages";

let client: Anthropic | null = null;

function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic();
  return client;
}

export async function generateNagMessage(context: NagPromptContext): Promise<string> {
  const anthropic = getClient();
  if (!anthropic) return pickFallbackMessage(context.mode, context.personaId);

  const { system, user } = buildNagPrompt(context);

  try {
    const response = await anthropic.messages.create({
      model: "claude-opus-5",
      max_tokens: 256,
      system,
      output_config: { effort: "low" },
      messages: [{ role: "user", content: user }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    return text || pickFallbackMessage(context.mode, context.personaId);
  } catch {
    return pickFallbackMessage(context.mode, context.personaId);
  }
}
