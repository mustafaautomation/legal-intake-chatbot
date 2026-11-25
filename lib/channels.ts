export interface InboundMessage {
  channel: "whatsapp" | "messenger";
  externalId: string;
  text: string;
  messageId: string;
}

export function verifyChallenge(params: URLSearchParams, expectedToken: string): string | null {
  if (params.get("hub.mode") !== "subscribe") return null;
  if (params.get("hub.verify_token") !== expectedToken) return null;
  return params.get("hub.challenge");
}

export function parseWhatsApp(body: unknown): InboundMessage | null {
  if (!body || typeof body !== "object") return null;
  const entry = (body as { entry?: Array<{ changes?: Array<{ value?: { messages?: Array<{ from?: string; id?: string; type?: string; text?: { body?: string } }> } }> }> }).entry?.[0];
  const message = entry?.changes?.[0]?.value?.messages?.[0];
  if (!message?.from || !message.text?.body) return null;
  return {
    channel: "whatsapp",
    externalId: message.from,
    text: message.text.body,
    messageId: message.id ?? "wa-unknown",
  };
}

export function parseMessenger(body: unknown): InboundMessage | null {
  if (!body || typeof body !== "object") return null;
  const event = (body as { entry?: Array<{ messaging?: Array<{ sender?: { id?: string }; message?: { mid?: string; text?: string } }> }> }).entry?.[0]?.messaging?.[0];
  if (!event?.sender?.id || !event.message?.text) return null;
  return {
    channel: "messenger",
    externalId: event.sender.id,
    text: event.message.text,
    messageId: event.message.mid ?? "ms-unknown",
  };
}

export function whatsAppOutbound(to: string, text: string) {
  return {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };
}

export function messengerOutbound(recipientId: string, text: string) {
  return {
    recipient: { id: recipientId },
    message: { text },
  };
}
