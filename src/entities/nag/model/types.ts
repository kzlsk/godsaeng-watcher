import type { NagPersonaId } from "@/shared/config/personas";

export interface NagPersonaScore {
  id: NagPersonaId;
  name: string;
  score: number;
}

export interface NagMessage {
  mode: "success" | "fail";
  quote: string;
  activePersonaId: NagPersonaId;
  personas: NagPersonaScore[];
}
