"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CONFIDENTIALITY_NOTICE, DISCLAIMER, FIRM } from "@/lib/firm";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function SiteHeader() {
  const pathname = usePathname();
  if (pathname === "/embed" || pathname === "/embed-demo") return null;
  return (
    <header className="no-print border-b border-line bg-paper/95">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group">
          <span className="block font-serif text-lg leading-none tracking-tight">{FIRM.name}</span>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Intake desk · {FIRM.city}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/chat" className="hover:text-brass">
            Intake
          </Link>
          <Link href="/admin" className="hover:text-brass">
            Pipeline
          </Link>
          <Link href="/embed-demo" className="hover:text-brass">
            Embed
          </Link>
          <Dialog>
            <DialogTrigger className="text-sm hover:text-brass">Disclaimer</DialogTrigger>
            <DialogContent>
              <DialogTitle>Before you type</DialogTitle>
              <DialogDescription>
                {DISCLAIMER} {CONFIDENTIALITY_NOTICE} {FIRM.name}, {FIRM.city}, and every matter on this desk are fictional.
                This is a portfolio demo. If you are in immediate danger, call 911. For domestic violence support in the
                United States, the National Domestic Violence Hotline is 1-800-799-7233.
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </nav>
      </div>
    </header>
  );
}
