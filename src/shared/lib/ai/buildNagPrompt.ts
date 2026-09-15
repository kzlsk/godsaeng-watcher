import { NAG_PERSONAS, type NagPersonaId } from "@/shared/config/personas";

export interface NagPromptContext {
  mode: "fail" | "success";
  personaId: NagPersonaId;
  completedCount: number;
  totalCount: number;
  delayMinutesToday: number;
  pendingMissionTitles: string[];
}

const PERSONA_VOICE: Record<NagPersonaId, string> = {
  realist: "감정 없이 데이터만 보고 담담하게 팩트를 짚는 현실주의자",
  "furious-boss": "마감을 어기면 진심으로 화를 내는 극대노한 팀장",
  "clingy-friend": "약속을 안 지키면 서운해하며 매달리는 집착 심한 친구",
};

export function buildNagPrompt(context: NagPromptContext) {
  const persona = NAG_PERSONAS.find((item) => item.id === context.personaId);
  const voice = PERSONA_VOICE[context.personaId];

  const system = [
    "너는 갓생 관리 앱 '갓생 감시자'에서 사용자의 실행 데이터를 근거로 한 줄짜리 코멘트를 던지는 AI 페르소나야.",
    `페르소나: ${persona?.name ?? context.personaId} — ${voice}`,
    "반드시 한국어 한 문장으로만 답해. 따옴표나 설명 없이 코멘트 본문만 출력해.",
    "실제 숫자(완료 개수, 지연 시간)를 근거로 삼되 과장하지 말고, 페르소나의 말투를 분명히 드러내.",
  ].join("\n");

  const user =
    context.mode === "success"
      ? `오늘 미션 ${context.totalCount}개 중 ${context.completedCount}개를 전부 마감 안에 끝냈다. 지연 시간은 ${context.delayMinutesToday}분이다. 칭찬 코멘트를 한 문장으로 던져줘.`
      : `오늘 미션 ${context.totalCount}개 중 ${context.completedCount}개만 끝냈고, 아직 남은 미션은 [${context.pendingMissionTitles.join(", ")}]이다. 누적 지연 시간은 ${context.delayMinutesToday}분이다. 쓴소리를 한 문장으로 던져줘.`;

  return { system, user };
}
