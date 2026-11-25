"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { CONFIDENTIALITY_NOTICE, DISCLAIMER, FIRM } from "@/lib/firm";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FirmMark } from "@/components/chat/mark";

export function SiteHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (pathname === "/embed" || pathname === "/embed-demo") return null;
  return (
    <header className={`no-print sticky top-0 z-40 border-b border-line ${scrolled ? "bg-background/80 backdrop-blur-md" : "bg-background/90"}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <FirmMark className="h-5 w-5" />
          <span>
            <span className="block font-serif text-[15px] leading-none">{FIRM.name}</span>
            <span className="text-[11px] text-muted">Intake desk · {FIRM.city}</span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 text-[13px]">
          <Link href="/#how" className="hidden hover:underline sm:inline">How it works</Link>
          <Link href="/chat" className="hidden hover:underline sm:inline">Live chat</Link>
          <Link href="/admin" className="hidden hover:underline md:inline">Admin</Link>
          <Link href="/embed-demo" className="hidden hover:underline md:inline">Embed</Link>
          <button
            type="button"
            data-testid="theme-toggle"
            aria-label={mounted && resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="grid h-8 w-8 place-items-center"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {mounted && resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            className="inline-flex h-9 items-center rounded-full bg-accent px-3 text-[13px] font-medium text-accent-foreground"
            onClick={() => window.dispatchEvent(new CustomEvent("hp-open-chat", { detail: {} }))}
          >
            Open the desk
          </button>
          <Dialog>
            <DialogTrigger className="text-[13px] underline">Disclaimer</DialogTrigger>
            <DialogContent>
              <DialogTitle>Before you type</DialogTitle>
              <DialogDescription>
                {DISCLAIMER} {CONFIDENTIALITY_NOTICE} {FIRM.name}, {FIRM.city}, and every matter on this desk are fictional. If you are in immediate danger, call 911.
              </DialogDescription>
            </DialogContent>
          </Dialog>
        </nav>
      </div>
    </header>
  );
}
