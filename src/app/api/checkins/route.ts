import { NextResponse } from "next/server";
import { getDailyStats, setMissionCompletion } from "@/shared/lib/demo-store";

export async function GET() {
  return NextResponse.json(getDailyStats());
}

export async function POST(request: Request) {
  const body = (await request.json()) as { missionId: string; isCompleted: boolean };
  setMissionCompletion(body.missionId, body.isCompleted);
  return NextResponse.json(getDailyStats());
}
