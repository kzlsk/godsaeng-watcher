import { NextResponse } from "next/server";
import { getStreak } from "@/shared/lib/demo-store";

export async function GET() {
  return NextResponse.json(getStreak());
}
