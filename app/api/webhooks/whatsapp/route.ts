import { verifyChallenge } from "@/lib/channels";
import { answerWhatsApp } from "@/lib/channel-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function token(): string {
  return process.env.WHATSAPP_VERIFY_TOKEN || "demo-verify-token";
}

export function GET(request: Request) {
  const challenge = verifyChallenge(new URL(request.url).searchParams, token());
  if (!challenge) return new Response("Forbidden", { status: 403 });
  return new Response(challenge, { status: 200 });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const result = await answerWhatsApp(body);
  if (!result) return Response.json({ ok: true, ignored: true });
  return Response.json({ ok: true, reply: result.reply, outbound: result.outbound });
}
