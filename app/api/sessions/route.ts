import { NextResponse } from "next/server";
import { createStoredSession } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await createStoredSession();
  return NextResponse.json({ session });
}
