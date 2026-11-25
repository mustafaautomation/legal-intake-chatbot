"use client";

import { usePathname } from "next/navigation";
import { ChatDock } from "@/components/chat/chat-dock";

export function SiteDock() {
  const pathname = usePathname();
  if (pathname === "/embed" || pathname === "/embed-demo" || pathname === "/chat") return null;
  return <ChatDock mode="overlay" />;
}
