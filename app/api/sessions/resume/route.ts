import { resumeBot } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const sessionId = body && typeof body === "object" && "sessionId" in body && typeof body.sessionId === "string" ? body.sessionId : "";
  if (!sessionId) return Response.json({ error: "Open an intake session first." }, { status: 400 });
  const result = await resumeBot(sessionId);
  if ("error" in result) return Response.json({ error: result.error }, { status: result.status });
  return Response.json({ session: result.session });
}
