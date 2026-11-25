import Link from "next/link";
import { ArrowRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ATTORNEYS, DISCLAIMER, FIRM } from "@/lib/firm";

const AREAS = [
  { title: "Personal injury", copy: "Collisions, falls, and other serious injuries. Usually a contingency fee, quoted in the engagement letter, not in chat.", lawyer: "Elena Harlow" },
  { title: "Employment", copy: "Terminations, wages, and harassment. Hourly or hybrid. The screening consult is free.", lawyer: "Julian Pierce" },
  { title: "Family", copy: "Divorce, custody, and support. Hourly, with a retainer quoted at the consult.", lawyer: "Priya Shah" },
  { title: "Immigration", copy: "Family petitions, removal defense, and naturalization. Flat fees are quoted at the consult.", lawyer: "Mateo Alvarez" },
];

const STEPS = [
  { n: "01", title: "Sort the matter", copy: "The desk reads what happened and names a practice area. That sort is not a legal conclusion." },
  { n: "02", title: "Screen the names", copy: "Party names are checked against a small mock client list. A match stops the chat so a person can review it." },
  { n: "03", title: "Ask the right questions", copy: "Each practice area has its own short form. The desk does not ask you to draft a demand or predict a result." },
  { n: "04", title: "Book, or say no", copy: "A score decides whether a screening consult is offered. Urgent safety, detention, and a hearing tomorrow skip the form." },
];

export default function HomePage() {
  return (
    <main>
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.3fr_0.7fr] md:py-20">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-brass">Est. {FIRM.established} · {FIRM.city} · fictional</p>
            <h1 className="mt-4 max-w-xl font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl">
              Tell us what happened. We will not tell you what the law requires.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted">
              {FIRM.name} uses this desk to intake personal injury, employment, family, and immigration inquiries.
              It searches the firm notes, calls the screening tools, and books a consultation when the matter fits.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/chat">
                  Start an intake <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/admin">Staff pipeline</Link>
              </Button>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-6 text-muted">{DISCLAIMER} If you are in immediate danger, call 911.</p>
          </div>
          <aside className="border border-line bg-sheet p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-brass">Sample, not a live matter</p>
            <div className="mt-4 space-y-4 text-sm leading-6">
              <p><span className="text-muted">You. </span>I was rear-ended last month on Harbor Avenue. The other driver was Marcus Bell.</p>
              <p><span className="text-muted">Desk. </span>This is a personal injury inquiry. The conflict screen found no match. That is a preliminary screen, not a formal conflicts opinion.</p>
              <p><span className="text-muted">Desk. </span>Score 90. Elena Harlow has Thursday at 10:00 open. A booking is not an engagement letter.</p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-3xl">Four practices. Nothing else.</h2>
          <Scale className="hidden h-8 w-8 text-brass md:block" aria-hidden />
        </div>
        <div className="mt-8 grid gap-px bg-line md:grid-cols-2">
          {AREAS.map((area) => (
            <article key={area.title} className="bg-paper p-5">
              <h3 className="font-serif text-2xl">{area.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{area.copy}</p>
              <p className="mt-4 text-sm">{area.lawyer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-ink text-sheet">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-4">
          {STEPS.map((step) => (
            <article key={step.n}>
              <p className="text-xs tracking-[0.18em] text-brass-soft">{step.n}</p>
              <h3 className="mt-2 font-serif text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-sheet/75">{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-serif text-3xl">Fees, in plain figures</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Published demo numbers. A real engagement letter would control. The desk will not estimate what a claim is worth.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="border border-line bg-sheet p-5">
            <h3 className="font-serif text-xl">Contingency</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Personal injury. 33% before a lawsuit is filed, 40% after. No attorney fee if there is no recovery. Costs are separate.</p>
          </article>
          <article className="border border-line bg-sheet p-5">
            <h3 className="font-serif text-xl">Hourly</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Employment $350–$475. Family $325–$450, retainers from $3,500. Screening consults for those areas are free.</p>
          </article>
          <article className="border border-line bg-sheet p-5">
            <h3 className="font-serif text-xl">Flat</h3>
            <p className="mt-2 text-sm leading-6 text-muted">Some uncontested family work and immigration filings. Immigration screening is $150, credited if the firm is retained.</p>
          </article>
        </div>
      </section>

      <section className="border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-4">
          {Object.values(ATTORNEYS).map((attorney) => (
            <article key={attorney.name}>
              <p className="font-serif text-5xl text-brass/40">{attorney.name.split(" ").map((part) => part[0]).join("")}</p>
              <h3 className="mt-2 font-serif text-xl">{attorney.name}</h3>
              <p className="text-sm text-muted">{attorney.title}</p>
              <p className="mt-2 text-sm leading-6">{attorney.focus}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-line bg-sheet">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="font-serif text-3xl">What’s under the hood</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            The live demo runs with no API key. If Groq or Gemini keys are present, those free tiers can phrase replies. The tools, the score, and the refusal rules stay in code.
          </p>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {[
              ["Channels", "Web chat, embeddable widget, WhatsApp, Messenger"],
              ["Agent", "Demo engine, or Groq llama-3.3-70b with Gemini fallback"],
              ["Knowledge", "26 firm notes, BM25 plus a local hash embedding"],
              ["Desk", "Conflict screen, intake score, bookings, handoff tickets"],
            ].map(([title, copy]) => (
              <article key={title} className="border border-line bg-paper p-4">
                <h3 className="font-serif text-xl">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{copy}</p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-brass" aria-hidden>
            Channels → Agent → Notes and tools → Pipeline
          </p>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted md:flex-row md:justify-between">
          <p>{FIRM.address} · {FIRM.phone} · {FIRM.hours}</p>
          <p>Portfolio demo. Not a law firm. Subdomain label: {FIRM.subdomain}</p>
        </div>
      </footer>
    </main>
  );
}
