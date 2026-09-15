import { NextResponse } from "next/server";
import { getFocusSession, updateFocusSession } from "@/shared/lib/demo-store";

export async function GET() {
  return NextResponse.json(getFocusSession());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { missionId?: string; action: "start" | "pause" | "resume" };
  const session = updateFocusSession(body.action, body.missionId);
  return NextResponse.json(session);
}
