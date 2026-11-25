"use client";

import { useEffect } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { useChat } from "@/components/chat/use-chat";
import { IntakeFile } from "@/components/intake-file";

export default function ChatPage() {
  const chat = useChat(true);
  useEffect(() => {
    const onOpen = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      if (prompt) void chat.send(prompt);
    };
    window.addEventListener("hp-open-chat", onOpen);
    return () => window.removeEventListener("hp-open-chat", onOpen);
  }, [chat]);
  return (
    <main className="mx-auto grid max-w-6xl gap-4 px-4 py-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <ChatPanel chat={chat} variant="page" autoFocus />
      <aside className="h-fit rounded-[16px] border border-line bg-surface p-4 lg:sticky lg:top-20">
        <h2 className="font-serif text-lg">Intake file</h2>
        <div className="mt-3">
          <IntakeFile session={chat.session} />
        </div>
      </aside>
    </main>
  );
}
