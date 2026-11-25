import type { Metadata } from "next";
import { ChatDesk } from "@/components/chat-desk";

export const metadata: Metadata = { title: "Intake widget — Harlow & Pierce LLP" };

export default function EmbedPage() {
  return <ChatDesk embedded />;
}
