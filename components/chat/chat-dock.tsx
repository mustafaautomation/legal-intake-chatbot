"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { NUDGES, TEASER } from "@/lib/brand";
import { FirmMark } from "./mark";
import { ChatPanel } from "./chat-panel";
import { useChat } from "./use-chat";

const TEASER_KEY = "hp-teaser-dismissed";

export function ChatDock({ mode = "overlay" }: { mode?: "overlay" | "embed" }) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const [nudges, setNudges] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [host, setHost] = useState({ width: 1280, height: 800 });
  const [seed, setSeed] = useState<string | null>(null);
  const chat = useChat(opened);
  const mobile = host.width < 640;
  const position = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("position") === "left" ? "left" : "right";

  useEffect(() => {
    const read = () => setHost({ width: window.innerWidth, height: window.innerHeight });
    if (mode === "overlay") {
      read();
      window.addEventListener("resize", read);
      return () => window.removeEventListener("resize", read);
    }
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "hp-host" && typeof event.data.width === "number") {
        setHost({ width: event.data.width, height: event.data.height });
      }
      if (event.data?.type === "hp-theme" && (event.data.theme === "light" || event.data.theme === "dark")) {
        document.documentElement.classList.toggle("dark", event.data.theme === "dark");
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [mode]);

  useEffect(() => {
    const visual = document.documentElement.dataset.visualTest === "1";
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nudgeTimer = window.setTimeout(() => setNudges(true), visual || reduced || mode === "embed" ? 0 : 1200);
    let teaserTimer = 0;
    if (localStorage.getItem(TEASER_KEY) !== "1") {
      teaserTimer = window.setTimeout(() => setTeaser(true), visual || reduced ? 0 : 4000);
    }
    return () => {
      window.clearTimeout(nudgeTimer);
      window.clearTimeout(teaserTimer);
    };
  }, [mode]);

  useEffect(() => {
    if (mode !== "embed") return;
    window.parent.postMessage({ type: "hp-resize", open, mobile, teaser: teaser && !open, position }, "*");
  }, [mode, open, mobile, teaser, position]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setOpened(true);
      setOpen(true);
      if (prompt) setSeed(prompt);
    };
    window.addEventListener("hp-open-chat", onOpen);
    return () => window.removeEventListener("hp-open-chat", onOpen);
  }, []);

  useEffect(() => {
    if (!seed || !chat.session || chat.pending) return;
    const prompt = seed;
    setSeed(null);
    void chat.send(prompt);
  }, [seed, chat.session, chat.pending, chat]);

  const align = position === "left" ? "items-start" : "items-end";
  const shell = mode === "overlay"
    ? `no-print fixed z-[2147483000] flex flex-col justify-end ${align} ${mobile && open ? "inset-0" : position === "left" ? "bottom-4 left-4 sm:bottom-6 sm:left-6" : "bottom-4 right-4 sm:bottom-6 sm:right-6"}`
    : `flex h-full w-full flex-col justify-end ${align} p-0`;

  return (
    <div className={shell} style={mode === "overlay" && open && !mobile ? { width: host.width < 1024 ? 380 : 400, height: "min(756px, calc(100dvh - 48px))" } : undefined}>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            className={`order-1 min-h-0 w-full ${mobile ? "h-full" : "mb-4 min-h-0 flex-1"}`}
            initial={mobile ? { opacity: 0, y: 24 } : { opacity: 0, y: 18, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={mobile ? { opacity: 0, y: 24 } : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: mobile ? 0.3 : 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: position === "left" ? "bottom left" : "bottom right" }}
          >
            <ChatPanel chat={chat} variant="widget" autoFocus={open} onClose={() => setOpen(false)} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      {!open && nudges ? (
        <div className={`order-2 mb-3 flex flex-col gap-3 ${align}`}>
          <button
            type="button"
            aria-label="Dismiss suggestions"
            className="grid h-6 w-6 place-items-center self-end text-muted"
            onClick={() => setNudges(false)}
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {NUDGES.map((pill) => (
            <button key={pill.id} type="button" data-testid="launcher-nudge" className="nudge-pill" onClick={() => { setOpened(true); setOpen(true); setSeed(pill.send); }}>
              {pill.label}
            </button>
          ))}
        </div>
      ) : null}
      {!open && teaser ? (
        <div data-testid="launcher-teaser" className={`teaser-bubble order-2 mb-3 flex max-w-[240px] items-start gap-2 rounded-[16px] px-3 py-2 text-[13px] leading-5 ${position === "left" ? "self-start" : "self-end"}`}>
          <p>{TEASER}</p>
          <button
            type="button"
            aria-label="Dismiss teaser"
            className="grid h-6 w-6 shrink-0 place-items-center"
            onClick={() => {
              localStorage.setItem(TEASER_KEY, "1");
              setTeaser(false);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}
      {!(open && mobile) ? (
        <button
          type="button"
          data-testid="chat-launcher"
          className="chat-launcher order-3 grid place-items-center"
          aria-label={open ? "Close chat" : "Open chat with Intake desk"}
          aria-expanded={open}
          aria-controls="hp-chat-widget"
          onClick={() => {
            setOpened(true);
            setOpen((value) => !value);
          }}
        >
          {open ? <X className="h-[22px] w-[22px]" strokeWidth={2} /> : <FirmMark />}
        </button>
      ) : null}
    </div>
  );
}
