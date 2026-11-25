"use client";

import { useEffect, useState } from "react";

interface Toast {
  kind: "urgent" | "handoff";
  title: string;
  name: string;
  message: string;
}

export function OpsToasts() {
  const [toast, setToast] = useState<Toast | null>(null);
  useEffect(() => {
    const onOps = (event: Event) => {
      const detail = (event as CustomEvent<Toast>).detail;
      if (!detail?.title) return;
      setToast(detail);
      window.setTimeout(() => setToast(null), 7000);
    };
    window.addEventListener("hp-ops", onOps);
    return () => window.removeEventListener("hp-ops", onOps);
  }, []);
  if (!toast) return null;
  return (
    <aside data-testid="ops-toast" role="status" className="no-print fixed bottom-28 left-4 z-[2147483001] w-[min(100%-2rem,22rem)] rounded-[16px] border border-line bg-surface p-3 shadow-[var(--shadow-card)]">
      <p className={`text-[13px] font-semibold ${toast.kind === "urgent" ? "text-danger" : ""}`}>{toast.title}</p>
      <p className="mt-1 text-[13px]">{toast.name}</p>
      <p className="mt-1 line-clamp-3 text-[12px] leading-5 text-muted">{toast.message}</p>
    </aside>
  );
}
