import { NextResponse } from "next/server";
import { computeNagMode, getDailyStats, getMissions, getNag, setNagMessage } from "@/shared/lib/demo-store";
import { generateNagMessage } from "@/shared/lib/ai/callClaude";
import { NAG_PERSONAS, type NagPersonaId } from "@/shared/config/personas";

async function regenerate(personaId: NagPersonaId) {
  const mode = computeNagMode();
  const missions = getMissions();
  const stats = getDailyStats();

  const quote = await generateNagMessage({
    mode,
    personaId,
    completedCount: missions.filter((mission) => mission.isCompleted).length,
    totalCount: missions.length,
    delayMinutesToday: stats.delayMinutesToday,
    pendingMissionTitles: missions.filter((mission) => !mission.isCompleted).map((mission) => mission.todo),
  });

  return setNagMessage(quote, personaId, mode);
}

export async function GET() {
  const nag = getNag();
  const currentMode = computeNagMode();

  if (currentMode !== nag.mode) {
    const updated = await regenerate(nag.activePersonaId);
    return NextResponse.json(updated);
  }

  return NextResponse.json(nag);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { personaId?: NagPersonaId };
  const personaId = body.personaId ?? getNag().activePersonaId ?? NAG_PERSONAS[0].id;
  const updated = await regenerate(personaId);
  return NextResponse.json(updated);
}
