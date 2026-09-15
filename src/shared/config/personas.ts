export const NAG_PERSONAS = [
  { id: "realist", name: "현실주의 팩폭러" },
  { id: "furious-boss", name: "극대노한 팀장님" },
  { id: "clingy-friend", name: "집착하는 친구" },
] as const;

export type NagPersonaId = (typeof NAG_PERSONAS)[number]["id"];
