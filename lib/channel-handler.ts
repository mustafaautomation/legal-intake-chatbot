import { messengerOutbound, parseMessenger, parseWhatsApp, whatsAppOutbound, type InboundMessage } from "./channels";
import { respond } from "./llm";
import { commitTurn, ensureChannelSession } from "./store";

export async function answerInbound(inbound: InboundMessage): Promise<{ reply: string; outbound: unknown }> {
  const session = await ensureChannelSession(inbound.channel, inbound.externalId);
  const result = await commitTurn(session.id, inbound.text, (current, ctx) => respond(current, inbound.text, ctx));
  if ("error" in result) return { reply: result.error, outbound: { error: result.error } };
  const reply = [...result.session.messages].reverse().find((message) => message.role === "assistant")?.content ?? "";
  const outbound =
    inbound.channel === "whatsapp" ? whatsAppOutbound(inbound.externalId, reply) : messengerOutbound(inbound.externalId, reply);
  return { reply, outbound };
}

export async function answerWhatsApp(body: unknown) {
  const inbound = parseWhatsApp(body);
  if (!inbound) return null;
  return answerInbound(inbound);
}

export async function answerMessenger(body: unknown) {
  const inbound = parseMessenger(body);
  if (!inbound) return null;
  return answerInbound(inbound);
}
