import { NextResponse } from "next/server";
import { listMatters } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const matters = await listMatters();
  return NextResponse.json({ matters });
}
