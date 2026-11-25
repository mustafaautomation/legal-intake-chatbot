"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PRACTICE_LABEL } from "@/lib/firm";
import type { LeadStatus, Matter, PracticeArea } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const COLUMNS: Array<{ status: LeadStatus; label: string }> = [
  { status: "urgent", label: "Immediate handoff" },
  { status: "in_intake", label: "In intake" },
  { status: "conflict_hold", label: "Conflict hold" },
  { status: "qualified", label: "Qualified" },
  { status: "consult_booked", label: "Consult booked" },
  { status: "unqualified", label: "Unqualified" },
];

export function Pipeline({ initial }: { initial: Matter[] }) {
  const router = useRouter();
  const [matters, setMatters] = useState(initial);
  const [area, setArea] = useState<"all" | PracticeArea>("all");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const visible = useMemo(
    () => matters.filter((matter) => area === "all" || matter.practiceArea === area),
    [matters, area],
  );

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/matters", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "The board did not refresh.");
      setMatters(data.matters);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The board did not refresh.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-4xl">Intake pipeline</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Synthetic leads only. Qualified and unqualified matters stay on the board. Open a card for the intake summary.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-sm text-muted" htmlFor="area-filter">
            Practice
          </label>
          <select
            id="area-filter"
            className="h-10 border border-line bg-sheet px-2 text-sm"
            value={area}
            onChange={(event) => setArea(event.target.value as "all" | PracticeArea)}
          >
            <option value="all">All areas</option>
            <option value="personal_injury">Personal injury</option>
            <option value="employment">Employment</option>
            <option value="family">Family</option>
            <option value="immigration">Immigration</option>
            <option value="out_of_scope">Outside the firm</option>
          </select>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </Button>
        </div>
      </div>
      {error ? (
        <p className="mt-4 border border-alert bg-alert-soft px-3 py-2 text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map((column) => {
          const cards = visible.filter((matter) => matter.status === column.status);
          return (
            <section key={column.status} className="w-72 shrink-0 border border-line bg-sheet">
              <header className="flex items-center justify-between border-b border-line px-3 py-2">
                <h2 className="text-sm font-medium">{column.label}</h2>
                <span className="text-xs text-muted">{cards.length}</span>
              </header>
              <div className="space-y-2 p-2">
                {cards.length === 0 ? <p className="px-1 py-6 text-center text-sm text-muted">Nothing in this column.</p> : null}
                {cards.map((matter) => (
                  <Link key={matter.id} href={`/admin/matters/${matter.id}`} className="block border border-line bg-paper p-3 hover:border-brass">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{matter.clientName}</p>
                      <span className="text-xs text-muted">{matter.id}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge>{PRACTICE_LABEL[matter.practiceArea]}</Badge>
                      {typeof matter.score === "number" ? <Badge>{matter.score}</Badge> : null}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-5 text-muted">{matter.summary}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
