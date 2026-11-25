import type { Metadata } from "next";
import { AdminInbox } from "@/components/admin-inbox";
import { Pipeline } from "@/components/pipeline";
import { listInbox, listMatters } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pipeline — Harlow & Pierce LLP" };

export default async function AdminPage() {
  const [matters, inbox] = await Promise.all([listMatters(), listInbox()]);
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <Pipeline initial={matters} />
      <AdminInbox sessions={inbox.sessions} tickets={inbox.tickets} />
    </main>
  );
}
