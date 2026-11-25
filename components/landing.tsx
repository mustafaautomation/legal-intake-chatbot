"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { SlotCard } from "@/components/chat/rich-cards";
import { useChat } from "@/components/chat/use-chat";
import { METRICS } from "@/lib/brand";
import { DISCLAIMER, FIRM } from "@/lib/firm";

const DOES = ["Sorts a matter into the four practices", "Screens names on the demo client list", "Books a screening consult when the score qualifies", "Cites the firm note it used"];
const WONT = ["Give legal advice or value a claim", "Invent fees beyond the published demo figures", "Pretend to be a human lawyer", "Promise a result or an arrival time"];

const ASKS = [
  { label: "Rear-ended last month", send: "I was rear-ended last month on Harbor Avenue in Ashford. I have a herniated disc and I've been treating with an orthopedist. The other driver was Marcus Bell from Northwind Couriers." },
  { label: "What a consult costs", send: "What are your fees for a personal injury matter?" },
  { label: "Talk to the intake team", send: "I want to talk to a human." },
];

function openWidget(prompt?: string) {
  window.dispatchEvent(new CustomEvent("hp-open-chat", { detail: { prompt } }));
}

export function Landing() {
  const [preview, setPreview] = useState<"desktop" | "phone">("desktop");
  const chat = useChat(true);
  return (
    <main>
      <section className="mx-auto grid max-w-6xl items-start gap-10 px-4 py-12 lg:grid-cols-[minmax(0,42rem)_minmax(18rem,1fr)] lg:py-16">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-brass">Est. {FIRM.established} · {FIRM.city} · fictional</p>
          <h1 className="mt-4 max-w-xl font-serif text-[48px] font-medium leading-[1.05] tracking-[-0.03em] md:text-[64px]">
            Tell us what <em className="italic">happened</em>.
          </h1>
          <p className="mt-4 max-w-xl text-[18px] leading-7 text-muted">
            We will not tell you what the law requires. {FIRM.name} uses this desk to intake personal injury, employment, family, and immigration inquiries.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" className="inline-flex h-11 items-center rounded-full bg-accent px-4 text-[14px] font-medium text-accent-foreground" onClick={() => openWidget(ASKS[1].send)}>
              Chat now
            </button>
            <Link href="/embed-demo" className="inline-flex h-11 items-center rounded-full border border-line px-4 text-[14px]">
              See the embed
            </Link>
          </div>
          <p className="mt-4 max-w-xl text-[13px] leading-5 text-muted">{DISCLAIMER} If you are in immediate danger, call 911.</p>
          <div className="mb-2 mt-8 flex gap-2 text-[12px]">
            <button type="button" data-testid="preview-toggle" aria-pressed={preview === "desktop"} className="rounded-full border border-line px-3 py-1" onClick={() => setPreview("desktop")}>Desktop</button>
            <button type="button" aria-pressed={preview === "phone"} className="rounded-full border border-line px-3 py-1" onClick={() => setPreview("phone")}>Phone</button>
          </div>
          <div className={`h-[520px] max-w-full ${preview === "phone" ? "w-[min(100%,390px)]" : "w-full sm:w-[400px]"}`}>
            <ChatPanel chat={chat} variant="frame" autoFocus={false} />
          </div>
        </div>
        <div data-testid="trust-panel" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <article className="rounded-[16px] border border-line bg-surface p-3">
            <h2 className="text-[14px] font-semibold">What it does</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {DOES.map((item) => (
                <li key={item} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-[16px] border border-line bg-surface p-3">
            <h2 className="text-[14px] font-semibold">What it won&apos;t do</h2>
            <ul className="mt-2 space-y-1 text-[13px]">
              {WONT.map((item) => (
                <li key={item} className="flex gap-2"><X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" aria-hidden />{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8">
        <h2 className="text-[13px] font-medium text-muted">Try asking</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {ASKS.map((ask) => (
            <button key={ask.label} type="button" data-testid="try-asking" className="h-9 rounded-full border border-line bg-surface px-3 text-[13px] font-medium" onClick={() => openWidget(ask.send)}>
              {ask.label}
            </button>
          ))}
        </div>
      </section>

      <section data-testid="metrics-strip" className="border-y border-line">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          {METRICS.map((item) => (
            <div key={item.label}>
              <dt className="text-[12px] text-muted">{item.label}</dt>
              <dd className="text-[28px] font-semibold leading-none">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-4 py-14">
        <p className="text-[12px] uppercase tracking-[0.16em] text-brass">What&apos;s under the hood</p>
        <h2 className="mt-2 font-serif text-3xl">How it works</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            ["01", "Channel", "Web chat, the embed, WhatsApp, or Messenger."],
            ["02", "Retrieve", "Firm notes, ranked with local BM25 and a hash embedding."],
            ["03", "Tools", "Classify, screen conflicts, score, and book."],
            ["04", "Desk", "The file lands on the staff board, or a person takes it."],
          ].map(([n, title, copy]) => (
            <li key={n} className="rounded-[16px] border border-line bg-surface p-4">
              <p className="text-[12px] text-brass">{n}</p>
              <h3 className="mt-1 font-serif text-2xl">{title}</h3>
              <p className="mt-2 text-[13px] leading-5 text-muted">{copy}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-center text-[13px] text-brass">Channel → Retrieve → Tools → Desk</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <h2 className="font-serif text-3xl">What the desk can show</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <SlotCard
            frozen
            slots={[
              { id: "g1", label: "Thu, Nov 27, 10:00 AM CT", send: "Thu, Nov 27, 10:00 AM CT" },
              { id: "g2", label: "Thu, Nov 27, 2:00 PM CT", send: "Thu, Nov 27, 2:00 PM CT" },
            ]}
            onSend={() => undefined}
          />
          <article className="rounded-[16px] border border-line bg-surface p-4">
            <h3 className="font-serif text-2xl">Fees, in plain figures</h3>
            <p className="mt-2 text-[13px] leading-5 text-muted">Personal injury is 33% before a lawsuit and 40% after. Employment is $350–$475 an hour. A booking is not an engagement letter.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <h2 className="font-serif text-3xl">Embed snippet</h2>
        <div className="mt-4 flex items-start justify-between gap-3 rounded-[16px] border border-line bg-surface p-4">
          <pre className="overflow-x-auto font-mono text-[13px] leading-6">{`<script src="https://legal-chat.quvantic.com/widget.js" data-firm="Harlow & Pierce LLP" defer></script>`}</pre>
          <button type="button" className="shrink-0 text-[13px] underline" onClick={() => void navigator.clipboard.writeText('<script src="https://legal-chat.quvantic.com/widget.js" data-firm="Harlow & Pierce LLP" defer></script>')}>
            Copy
          </button>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-[13px] text-muted md:flex-row md:justify-between">
          <p>{FIRM.address} · {FIRM.phone} · {FIRM.hours}</p>
          <p>
            <a className="underline" href="https://github.com/mustafaautomation/legal-intake-chatbot">GitHub</a>
          </p>
        </div>
      </footer>
    </main>
  );
}
