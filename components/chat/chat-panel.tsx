"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, BookOpen, Check, Copy, FileText, Headphones, Mic, MoreHorizontal, Moon, Paperclip, Plus, RefreshCw, Square, Sun, ThumbsDown, ThumbsUp, X } from "lucide-react";
import { useTheme } from "next-themes";
import { BOT, GREETING, PLACEHOLDER, STARTER_ICONS } from "@/lib/brand";
import { attachmentNames, deriveCards, followUps, visibleUserText } from "@/lib/cards";
import { DISCLAIMER, PORTFOLIO_LINE, TOOL_LABELS } from "@/lib/firm";
import { displayTurnText } from "@/lib/slots";
import type { ChatMessage, Citation } from "@/lib/types";
import { Markdown } from "@/components/markdown";
import { FirmMark } from "./mark";
import { LeadCard, RichCards } from "./rich-cards";
import { useChat } from "./use-chat";

export function ChatPanel({
  chat,
  variant,
  onClose,
  autoFocus,
}: {
  chat: ReturnType<typeof useChat>;
  variant: "widget" | "page" | "frame";
  onClose?: () => void;
  autoFocus?: boolean;
}) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [stick, setStick] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [thumb, setThumb] = useState<Record<string, "up" | "down">>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    if (autoFocus && !mobile) inputRef.current?.focus();
    else if (mobile && onClose) closeRef.current?.focus();
  }, [autoFocus, onClose]);

  useEffect(() => {
    if (!stick) return;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [chat.session?.messages.length, chat.reveal, chat.pending, stick]);

  const session = chat.session;
  const hasUser = session?.messages.some((message) => message.role === "user") ?? false;
  const showEmpty = Boolean(session) && !hasUser && !chat.pending;
  const messages = (session?.messages ?? []).filter((message, index) => !(index === 0 && message.role === "assistant"));
  const placeholder = chat.humanJoined ? `Message ${BOT.humanName}…` : chat.listening ? "Listening…" : PLACEHOLDER;

  function onScroll() {
    const el = scroller.current;
    if (!el) return;
    setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  }

  function grow(target: HTMLTextAreaElement) {
    target.style.height = "0px";
    target.style.height = `${Math.min(target.scrollHeight, 22 * 6)}px`;
  }

  return (
    <section
      id={variant === "widget" ? "hp-chat-widget" : undefined}
      data-testid={variant === "frame" ? "landing-hero-chat" : "chat-widget"}
      className={variant === "page" ? "flex min-h-[70vh] flex-col border border-line bg-surface" : "chat-widget-shell flex h-full min-h-0 flex-col"}
      onDragOver={(event) => {
        event.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragOver(false);
        chat.addFiles([...event.dataTransfer.files]);
      }}
    >
      <header data-testid="chat-header" className="relative flex h-16 shrink-0 items-center gap-2 border-b border-line px-3">
        <span className="absolute inset-x-0 top-0 h-0.5 bg-brass" />
        <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-soft text-[11px] font-semibold">
          {chat.humanJoined ? "EH" : <FirmMark className="h-4 w-4" />}
          <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-success ring-2 ring-[var(--surface)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold leading-5 tracking-[-0.01em]">
            {chat.humanJoined ? BOT.humanName : `${BOT.name} · ${BOT.brand}`}
          </p>
          <p className="truncate text-[12px] leading-4 text-muted">
            {chat.humanJoined ? `${BOT.humanRole}` : "Online 24/7 · Not legal advice"}
          </p>
        </div>
        <span data-testid="mode-pill" className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium">
          {chat.mode === "live" ? "Live AI" : "Demo mode"}
        </span>
        <button type="button" className="grid h-8 w-8 place-items-center" aria-label="Chat menu" aria-expanded={menu} onClick={() => setMenu((open) => !open)}>
          <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
        </button>
        {onClose ? (
          <button ref={closeRef} type="button" className="grid h-8 w-8 place-items-center" aria-label="Close chat" onClick={onClose}>
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        ) : null}
        {menu ? (
          <div className="absolute right-3 top-14 z-10 w-48 rounded-[14px] border border-line bg-surface p-1 shadow-[var(--shadow-card)]">
            <button type="button" className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left text-[13px]" onClick={() => { setMenu(false); void chat.reset(); }}>
              <Plus className="h-4 w-4" /> New chat
            </button>
            <button
              type="button"
              data-testid="theme-toggle"
              className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left text-[13px]"
              onClick={() => {
                setTheme(resolvedTheme === "dark" ? "light" : "dark");
                setMenu(false);
              }}
            >
              {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {mounted && resolvedTheme === "dark" ? "Light" : "Dark"}
            </button>
            <button type="button" className="flex w-full items-center gap-2 rounded-[10px] px-2 py-2 text-left text-[13px]" onClick={() => { setMenu(false); void chat.send("I want to talk to a human."); }}>
              <Headphones className="h-4 w-4" /> Talk to a human
            </button>
          </div>
        ) : null}
      </header>
      {session?.handoff ? (
        <p data-testid="handoff-banner" className="border-b border-line bg-accent-soft px-3 py-2 text-[12px]">
          {chat.humanJoined ? `${BOT.humanName} joined` : "Connecting you to a team member…"}
        </p>
      ) : null}
      <div className="sr-only" role="status" aria-live="polite">
        {chat.statusLive}
      </div>
      <div ref={scroller} data-testid="chat-messages" role="log" aria-relevant="additions" className="thin-scroll relative min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3" onScroll={onScroll}>
        {chat.opening ? <p className="text-[13px] text-muted">Opening a file…</p> : null}
        {chat.error ? (
          <p role="alert" className="rounded-[12px] border border-danger px-3 py-2 text-[13px] text-danger">
            {chat.error}
          </p>
        ) : null}
        {showEmpty ? <EmptyState suggestions={session?.messages[0]?.suggestions ?? []} onSend={(text) => void chat.send(text)} /> : null}
        {messages.map((message, index) => (
          <Message
            key={message.id}
            message={message}
            session={session!}
            latest={index === messages.length - 1 && !chat.pending}
            human={chat.humanJoined}
            files={chat.fileLog.find((entry) => entry.text === message.content)?.files}
            copied={copied === message.id}
            thumb={thumb[message.id]}
            preview={preview}
            onPreview={setPreview}
            onCopy={() => {
              const text = message.role === "user" ? visibleUserText(message.content) : message.content;
              void navigator.clipboard.writeText(text);
              setCopied(message.id);
              window.setTimeout(() => setCopied(null), 2000);
            }}
            onThumb={(value) => setThumb((current) => ({ ...current, [message.id]: value }))}
            onRetry={() => chat.retry()}
            onSend={(text) => void chat.send(text)}
            onLead={() => chat.setLeadOpen(true)}
          />
        ))}
        {chat.pending ? (
          <article data-testid="message-assistant" data-streaming="true" aria-busy="true" aria-label={`${BOT.name}, now`} className="text-[14.5px] leading-[22px]">
            <p data-testid="phase-indicator" className="mb-1 flex items-center gap-2 text-[12px] text-muted">
              {chat.phase}
              <span className="phase-dots" aria-hidden>
                <span>.</span>
                <span>.</span>
                <span>.</span>
              </span>
            </p>
            {chat.reveal ? (
              <div>
                <Markdown text={chat.reveal} />
                <span className="stream-caret" />
              </div>
            ) : (
              <div className="shimmer h-16 rounded-[12px]" />
            )}
          </article>
        ) : null}
        {chat.stopped && chat.reveal ? <p className="text-[11.5px] text-muted">Stopped</p> : null}
        <div ref={endRef} />
      </div>
      {!stick ? (
        <button type="button" data-testid="jump-to-latest" className="mx-auto mb-2 inline-flex h-9 items-center gap-1 rounded-full border border-line bg-surface px-3 text-[13px] shadow-[var(--shadow-card)]" onClick={() => { setStick(true); endRef.current?.scrollIntoView({ block: "end" }); }}>
          <ArrowDown className="h-4 w-4" /> Jump to latest
        </button>
      ) : null}
      <div className="shrink-0 px-3 pb-[max(8px,env(safe-area-inset-bottom))]">
        <button type="button" data-testid="lead-link" className="mb-1 text-[12px] text-muted underline" onClick={() => chat.setLeadOpen((open) => !open)}>
          Leave contact details for the team
        </button>
        {chat.leadOpen ? (
          <div className="mb-2">
            <LeadCard
              testId="card-lead"
              onSend={(text) => {
                chat.setLeadOpen(false);
                void chat.send(text);
              }}
            />
          </div>
        ) : null}
        {chat.files.length > 0 ? (
          <ul className="mb-2 flex flex-wrap gap-2">
            {chat.files.map((file) => (
              <li key={file.id} className="flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2 py-1 text-[12px]">
                {file.mime === "application/pdf" ? <FileText className="h-4 w-4" /> : <span role="img" aria-label={file.name} className="h-8 w-8 rounded bg-cover" style={{ backgroundImage: `url("${file.url}")` }} />}
                <span className="max-w-24 truncate">{file.name}</span>
                <button type="button" aria-label={`Remove ${file.name}`} onClick={() => chat.removeFile(file.id)}>
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <form
          data-testid="composer"
          className="flex items-end gap-1 rounded-[16px] border border-line bg-surface-2 p-2 pl-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (chat.pending) chat.stop();
            else void chat.send(chat.draft);
          }}
        >
          <button type="button" data-testid="composer-attach" aria-label="Attach a file" className="grid h-11 w-8 place-items-center" onClick={() => fileRef.current?.click()}>
            <Paperclip className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <input ref={fileRef} type="file" aria-label="Choose a file to attach" accept="image/jpeg,image/png,image/webp,application/pdf" multiple className="sr-only" onChange={(event) => { chat.addFiles([...(event.target.files ?? [])]); event.target.value = ""; }} />
          <label className="sr-only" htmlFor={`composer-${variant}`}>
            Message the intake desk
          </label>
          <textarea
            id={`composer-${variant}`}
            ref={inputRef}
            data-testid="composer-input"
            rows={2}
            value={chat.draft}
            placeholder={placeholder}
            className="thin-scroll max-h-[132px] min-h-[52px] flex-1 resize-none bg-transparent py-2 text-[14.5px] leading-[22px] outline-none"
            onChange={(event) => {
              chat.setDraft(event.target.value);
              grow(event.target);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                if (chat.pending) chat.stop();
                else void chat.send(chat.draft);
              }
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void chat.send(chat.draft);
              }
            }}
          />
          <button type="button" data-testid="composer-mic" aria-label={chat.listening ? "Stop dictation" : "Start dictation"} className={`grid h-11 w-8 place-items-center ${chat.listening ? "rounded-full ring-2 ring-accent" : ""}`} onClick={chat.toggleVoice}>
            <Mic className="h-5 w-5" strokeWidth={1.75} />
          </button>
          {chat.pending ? (
            <button type="button" data-testid="composer-stop" aria-label="Stop generating" className="grid h-11 w-11 place-items-center" onClick={chat.stop}>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground">
                <Square className="h-2.5 w-2.5 fill-current" />
              </span>
            </button>
          ) : (
            <button type="submit" data-testid="composer-send" aria-label="Send" aria-disabled={chat.draft.trim().length === 0 && chat.files.length === 0} disabled={!session || (chat.draft.trim().length === 0 && chat.files.length === 0)} className="grid h-11 w-11 place-items-center disabled:opacity-40">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground">
                <ArrowUp className="h-4 w-4" strokeWidth={1.75} />
              </span>
            </button>
          )}
        </form>
        <p className="mt-1 text-[11.5px] leading-4 text-muted">
          AI can be inaccurate.{" "}
          <button type="button" className="underline" onClick={() => void chat.send("I want to talk to a human.")}>
            Talk to a person
          </button>
        </p>
        <p className="text-[11px] leading-4 text-muted">
          AI assistant · Portfolio demo ·{" "}
          <button type="button" className="underline" onClick={() => setPrivacy((open) => !open)}>
            Privacy
          </button>
        </p>
        <p className="text-[11px] leading-4 text-muted">{PORTFOLIO_LINE}</p>
        {privacy ? <p className="mt-1 text-[11.5px] leading-4 text-muted">{DISCLAIMER} This chat is not privileged.</p> : null}
        {chat.toast ? <p role="status" className="mt-1 text-[12px]">{chat.toast}</p> : null}
      </div>
      {dragOver ? <div className="pointer-events-none absolute inset-4 grid place-items-center rounded-[16px] border border-dashed border-accent bg-surface/80 text-[13px]">Drop to attach</div> : null}
    </section>
  );
}

function EmptyState({ suggestions, onSend }: { suggestions: Array<{ id: string; label: string; send: string }>; onSend: (text: string) => void }) {
  return (
    <div>
      <p className="text-[14.5px] leading-[22px]">{GREETING}</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {suggestions.slice(0, 4).map((suggestion) => {
          const Icon = STARTER_ICONS[suggestion.id] ?? Headphones;
          return (
            <button key={suggestion.id} type="button" data-testid="starter" className="flex min-h-16 items-start gap-2 rounded-[16px] border border-line p-3 text-left text-[13px] font-medium leading-4 hover:bg-accent-soft" onClick={() => onSend(suggestion.send)}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {suggestion.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Message({
  message,
  session,
  latest,
  human,
  files,
  copied,
  thumb,
  preview,
  onPreview,
  onCopy,
  onThumb,
  onRetry,
  onSend,
  onLead,
}: {
  message: ChatMessage;
  session: NonNullable<ReturnType<typeof useChat>["session"]>;
  latest: boolean;
  human: boolean;
  files?: Array<{ id: string; url: string; mime: string; name: string }>;
  copied: boolean;
  thumb?: "up" | "down";
  preview: string | null;
  onPreview: (id: string | null) => void;
  onCopy: () => void;
  onThumb: (value: "up" | "down") => void;
  onRetry: () => void;
  onSend: (text: string) => void;
  onLead: () => void;
}) {
  const time = new Date(message.createdAt);
  const label = time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const user = message.role === "user";
  const text = user ? displayTurnText(visibleUserText(message.content)) : message.content;
  const long = !user && (text.length > 140 || text.includes("\n"));
  const cards = user ? [] : deriveCards(message, session, latest);
  const chips = !user && latest ? followUps(session, message) : [];
  const names = attachmentNames(message.content);
  return (
    <article data-testid={user ? "message-user" : "message-assistant"} aria-label={`${user ? "You" : human ? BOT.humanName : BOT.name}, ${label}`} className={`group ${user ? "ml-auto max-w-[82%]" : ""}`}>
      <div className={user ? "rounded-[18px] rounded-br-[4px] bg-accent px-3 py-2 text-[14.5px] leading-[22px] text-accent-foreground" : human && !long ? "rounded-[18px] bg-surface-2 px-3 py-2 text-[14.5px] leading-[22px]" : "text-[14.5px] leading-[22px]"}>
        <Markdown text={text} />
        {files?.map((file) => (file.mime === "application/pdf" ? <span key={file.id} className="mt-1 block text-[12px]">{file.name}</span> : <span key={file.id} role="img" aria-label={file.name} className="mt-1 block h-12 w-12 rounded bg-cover" style={{ backgroundImage: `url("${file.url}")` }} />))}
        {names.length > 0 && !files ? <p className="mt-1 text-[12px]">Got {names.join(", ")}. The desk can still continue this intake; this demo does not analyze documents.</p> : null}
      </div>
      <time dateTime={message.createdAt} className="mt-1 block text-[11.5px] text-muted opacity-0 group-hover:opacity-100 focus-within:opacity-100">
        {label}
      </time>
      {human && user ? <p className="text-[11px] text-muted">Seen</p> : null}
      {!user && message.tools && message.tools.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {message.tools.map((tool, index) => (
            <li key={`${tool.name}-${index}`} className="flex h-10 items-center justify-between rounded-[12px] border border-line px-3 text-[13px]">
              <span>{TOOL_LABELS[tool.name] ?? tool.name}</span>
              <span className="text-[11.5px] text-muted">Done</span>
            </li>
          ))}
        </ul>
      ) : null}
      {!user ? <RichCards cards={cards} onSend={onSend} onLead={onLead} /> : null}
      {!user && message.citations && message.citations.length > 0 ? <Citations citations={message.citations} preview={preview} onPreview={onPreview} /> : null}
      {!user ? (
        <div className="mt-2 flex flex-wrap gap-1">
          <Action label="Copy" icon={copied ? Check : Copy} pressed={false} onClick={onCopy} />
          <Action label="Regenerate" icon={RefreshCw} pressed={false} onClick={onRetry} />
          <Action label="Good reply" icon={ThumbsUp} pressed={thumb === "up"} onClick={() => onThumb("up")} />
          <Action label="Bad reply" icon={ThumbsDown} pressed={thumb === "down"} onClick={() => onThumb("down")} />
          {message.citations && message.citations.length > 0 ? <Action label="Sources" icon={BookOpen} pressed={false} onClick={() => onPreview(message.citations?.[0]?.id ?? null)} /> : null}
        </div>
      ) : null}
      {chips.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <button key={chip.id} type="button" data-testid="quick-reply" className="h-9 rounded-full border border-line bg-surface px-3 text-[13px] font-medium hover:bg-accent-soft" onClick={() => (chip.send === "__lead__" ? onLead() : onSend(chip.send))}>
              {chip.label}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function Action({ label, icon: Icon, pressed, onClick }: { label: string; icon: typeof Copy; pressed: boolean; onClick: () => void }) {
  return (
    <button type="button" title={label} aria-label={label} aria-pressed={pressed} className="inline-flex h-8 items-center gap-1 rounded-full px-2 text-[11.5px] text-muted hover:bg-accent-soft" onClick={onClick}>
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> {label}
    </button>
  );
}

function Citations({ citations, preview, onPreview }: { citations: Citation[]; preview: string | null; onPreview: (id: string | null) => void }) {
  return (
    <div className="mt-2">
      <p className="text-[11.5px] text-muted">Sources</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {citations.map((citation) => {
          const open = preview === citation.id;
          return (
            <div key={citation.id} className="relative" onMouseEnter={() => onPreview(citation.id)} onMouseLeave={() => onPreview(null)}>
              <button type="button" data-testid="citation-chip" className="h-8 rounded-full border border-line bg-surface px-3 text-[12px]" aria-expanded={open} onFocus={() => onPreview(citation.id)} onKeyDown={(event) => { if (event.key === "Escape") onPreview(null); }} onClick={() => onPreview(open ? null : citation.id)}>
                {citation.title}
              </button>
              {open ? (
                <div data-testid="citation-preview" className="absolute left-0 z-10 mt-1 w-64 rounded-[12px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
                  <p className="text-[14px] font-semibold">{citation.title}</p>
                  <p className="mt-1 line-clamp-3 text-[13px]">{citation.excerpt || citation.source}</p>
                  <a className="mt-2 inline-block text-[13px] underline" href={`/kb/${citation.id}`} target="_blank" rel="noreferrer">
                    Open source <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
