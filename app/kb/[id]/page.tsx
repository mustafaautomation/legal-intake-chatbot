import Link from "next/link";
import { notFound } from "next/navigation";
import { FIRM } from "@/lib/firm";
import { getChunk } from "@/lib/rag";

export const dynamic = "force-dynamic";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const chunk = getChunk(decodeURIComponent(id));
  if (!chunk) notFound();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-sm text-muted underline">
        Back to the desk
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.16em] text-brass">{chunk.source}</p>
      <h1 className="mt-2 font-serif text-4xl">{chunk.title}</h1>
      <p className="mt-2 text-sm text-muted">{FIRM.name} · firm note · not legal advice</p>
      <article className="mt-6 whitespace-pre-wrap text-[15px] leading-7">{chunk.body}</article>
    </main>
  );
}
