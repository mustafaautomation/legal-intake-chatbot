import { NextResponse } from "next/server";
import { FIRM } from "@/lib/firm";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "legal-intake-chatbot",
    firm: FIRM.name,
    mode: "policy",
    subdomain: FIRM.subdomain,
  });
}
