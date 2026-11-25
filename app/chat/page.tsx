import type { Metadata } from "next";
import { ChatDesk } from "@/components/chat-desk";

export const metadata: Metadata = {
  title: "Intake — Harlow & Pierce LLP",
};

export default function ChatPage() {
  return (
    <main>
      <ChatDesk />
    </main>
  );
}
