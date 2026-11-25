"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { phaseLabel } from "@/lib/phase";
import type { Session } from "@/lib/types";

export interface LocalFile {
  id: string;
  name: string;
  mime: string;
  url: string;
  size: number;
}

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

function wordsPerTick(text: string) {
  const words = text.split(/\s+/).length;
  return words > 90 ? 8 : 3;
}

export function useChat(active: boolean) {
  const [session, setSession] = useState<Session | null>(null);
  const [opening, setOpening] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);
  const [reveal, setReveal] = useState("");
  const [stopped, setStopped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [fileLog, setFileLog] = useState<Array<{ text: string; files: LocalFile[] }>>([]);
  const [listening, setListening] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [statusLive, setStatusLive] = useState("");
  const [humanJoined, setHumanJoined] = useState(false);
  const [leadOpen, setLeadOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const revealTimer = useRef<number | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const announced = useRef({ handoff: false, urgent: false });
  const fileCount = useRef(0);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const clearReveal = useCallback(() => {
    if (revealTimer.current) window.clearInterval(revealTimer.current);
    revealTimer.current = null;
  }, []);

  const openSession = useCallback(async () => {
    setOpening(true);
    setError(null);
    setHumanJoined(false);
    announced.current = { handoff: false, urgent: false };
    try {
      const response = await fetch("/api/sessions", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The desk did not open.");
      setSession(data.session);
      setMode("demo");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The desk did not open.");
    } finally {
      setOpening(false);
    }
  }, []);

  useEffect(() => {
    if (active && !session && !opening) void openSession();
  }, [active, session, opening, openSession]);

  useEffect(() => {
    if (!session?.handoff) {
      setHumanJoined(false);
      return;
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setHumanJoined(true), reduced ? 0 : 900);
    return () => window.clearTimeout(timer);
  }, [session?.handoff, session?.id]);

  useEffect(() => {
    if (!session) return;
    const lastUser = [...session.messages].reverse().find((message) => message.role === "user");
    if (session.urgency === "immediate" && !announced.current.urgent) {
      announced.current.urgent = true;
      window.dispatchEvent(
        new CustomEvent("hp-ops", {
          detail: { kind: "urgent", title: "Desk alerted", name: session.intake.clientName || "Prospective client", message: lastUser?.content ?? "Urgent intake" },
        }),
      );
    }
    if (session.handoff && session.urgency !== "immediate" && !announced.current.handoff) {
      announced.current.handoff = true;
      window.dispatchEvent(
        new CustomEvent("hp-ops", {
          detail: {
            kind: "handoff",
            title: "New human support request",
            name: session.intake.clientName || "Prospective client",
            message: lastUser?.content ?? "Asked for a person",
          },
        }),
      );
    }
  }, [session]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    clearReveal();
    setPending(false);
    setPhase(null);
    setStopped(true);
    setStatusLive("Stopped");
  }, [clearReveal]);

  const send = useCallback(
    async (text: string) => {
      const current = sessionRef.current;
      const trimmed = text.trim();
      if (!current || pending) return;
      if (!trimmed && files.length === 0) return;
      if (trimmed === "__lead__") {
        setLeadOpen(true);
        return;
      }
      const names = files.map((file) => file.name);
      const message = names.length ? `${trimmed || "I attached a file."}\n\nAttached: ${names.join(", ")}` : trimmed;
      const previous = current;
      const attached = files;
      setFiles([]);
      setDraft("");
      setError(null);
      setStopped(false);
      setReveal("");
      setPending(true);
      setPhase(phaseLabel(trimmed || "file", current));
      setStatusLive("Assistant is replying");
      if (attached.length) setFileLog((log) => [...log, { text: message, files: attached }]);
      setSession({
        ...current,
        messages: [
          ...current.messages,
          { id: `local-${Date.now()}`, role: "user", content: message, createdAt: new Date().toISOString() },
        ],
      });
      const controller = new AbortController();
      abortRef.current = controller;
      const started = Date.now();
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: current.id, message, stream: true }),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          const data = await response.json().catch(() => ({ error: "The message did not go through." }));
          throw new Error(data.error || "The message did not go through.");
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let target = "";
        let shown = "";
        let doneSession: Session | null = null;
        let doneMode: "live" | "demo" = "demo";
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        await new Promise<void>((resolve, reject) => {
          const timer = window.setInterval(() => {
            if (Date.now() - started < (reduced ? 80 : 320) && shown.length === 0) return;
            if (shown.length < target.length) {
              const rest = target.slice(shown.length);
              const parts = rest.split(/(\s+)/);
              let take = 0;
              let count = 0;
              const goal = wordsPerTick(target);
              for (const part of parts) {
                take += part.length;
                if (part.trim()) count += 1;
                if (count >= goal) break;
              }
              shown = target.slice(0, shown.length + Math.max(take, 1));
              setReveal(shown);
              return;
            }
            if (doneSession && shown.length >= target.length) {
              window.clearInterval(timer);
              revealTimer.current = null;
              setSession(doneSession);
              setMode(doneMode);
              setReveal("");
              setPending(false);
              setPhase(null);
              setStatusLive("Assistant replied");
              resolve();
            }
          }, reduced ? 16 : 24);
          revealTimer.current = timer;
          const pump = async () => {
            try {
              while (true) {
                const step = await reader.read();
                if (step.done) break;
                buffer += decoder.decode(step.value, { stream: true });
                const chunks = buffer.split("\n\n");
                buffer = chunks.pop() ?? "";
                for (const chunk of chunks) {
                  const line = chunk.split("\n").find((item) => item.startsWith("data: "));
                  if (!line) continue;
                  const event = JSON.parse(line.slice(6)) as { type: string; text?: string; session?: Session; mode?: "live" | "demo" };
                  if (event.type === "delta" && event.text) target += event.text;
                  if (event.type === "done" && event.session) {
                    doneSession = event.session;
                    doneMode = event.mode === "live" ? "live" : "demo";
                    const finalText = [...event.session.messages].reverse().find((item) => item.role === "assistant")?.content ?? target;
                    if (finalText.startsWith(target) || target.length === 0) target = finalText;
                  }
                }
              }
              if (!doneSession) throw new Error("The message did not go through.");
            } catch (cause) {
              window.clearInterval(timer);
              reject(cause);
            }
          };
          void pump();
        });
      } catch (cause) {
        clearReveal();
        if (controller.signal.aborted) return;
        setSession(previous);
        setDraft(trimmed);
        setFiles(attached);
        setError(cause instanceof Error ? cause.message : "The message did not go through.");
        setPending(false);
        setPhase(null);
        setReveal("");
      }
    },
    [clearReveal, files, pending],
  );

  const retry = useCallback(() => {
    const current = sessionRef.current;
    if (!current) return;
    const lastUser = [...current.messages].reverse().find((message) => message.role === "user");
    if (lastUser) void send(lastUser.content.replace(/\n\nAttached: .+$/, ""));
  }, [send]);

  const reset = useCallback(async () => {
    const current = sessionRef.current;
    if (current?.handoff && !window.confirm("A handoff is open. Start a new intake?")) return;
    setSession(null);
    await openSession();
  }, [openSession]);

  function addFiles(list: File[]) {
    const next: LocalFile[] = [];
    for (const file of list) {
      if (!ACCEPT.includes(file.type)) {
        setError("Attach a JPG, PNG, WEBP, or PDF.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Each file must be 5 MB or smaller.");
        continue;
      }
      if (files.length + next.length >= 3) {
        setError("Three files per message.");
        break;
      }
      if (fileCount.current >= 10) {
        setError("Ten files per conversation.");
        break;
      }
      fileCount.current += 1;
      next.push({ id: `${file.name}-${file.size}-${next.length}`, name: file.name, mime: file.type, url: URL.createObjectURL(file), size: file.size });
    }
    if (next.length) setFiles((current) => [...current, ...next]);
  }

  function removeFile(id: string) {
    setFiles((current) => current.filter((file) => file.id !== id));
  }

  function toggleVoice() {
    const w = window as Window & { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setToast("Voice input isn't available in this browser. Type instead.");
      window.setTimeout(() => setToast(null), 4000);
      return;
    }
    if (listening) {
      setListening(false);
      return;
    }
    try {
      const rec = new Ctor();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.onresult = (event) => {
        const said = event.results?.[0]?.[0]?.transcript ?? "";
        if (said) setDraft((current) => (current ? `${current} ${said}` : said));
      };
      rec.onerror = () => {
        setListening(false);
        setToast("Voice input isn't available in this browser. Type instead.");
        window.setTimeout(() => setToast(null), 4000);
      };
      rec.onend = () => setListening(false);
      rec.start();
      setListening(true);
    } catch {
      setToast("Voice input isn't available in this browser. Type instead.");
      window.setTimeout(() => setToast(null), 4000);
    }
  }

  return {
    session,
    opening,
    draft,
    setDraft,
    pending,
    phase,
    reveal,
    stopped,
    error,
    mode,
    files,
    fileLog,
    listening,
    toast,
    statusLive,
    humanJoined,
    leadOpen,
    setLeadOpen,
    send,
    stop,
    retry,
    reset,
    addFiles,
    removeFile,
    toggleVoice,
  };
}

interface SpeechRec {
  lang: string;
  interimResults: boolean;
  start: () => void;
  onresult: ((event: { results?: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
