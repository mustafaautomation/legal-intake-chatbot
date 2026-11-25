"use client";

import { useEffect } from "react";
import { ChatDock } from "@/components/chat/chat-dock";

export default function EmbedPage() {
  useEffect(() => {
    document.documentElement.dataset.embed = "true";
    const theme = new URLSearchParams(window.location.search).get("theme");
    if (theme === "dark") document.documentElement.classList.add("dark");
    if (theme === "light") document.documentElement.classList.remove("dark");
  }, []);
  return <ChatDock mode="embed" />;
}
