"use client";

import { usePathname } from "next/navigation";
import { PORTFOLIO_LINE } from "@/lib/firm";

export function PortfolioFooter() {
  const pathname = usePathname();
  if (pathname === "/embed") return null;
  return (
    <footer className="no-print border-t border-line">
      <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-muted">{PORTFOLIO_LINE}</p>
    </footer>
  );
}
