import { getChunk } from "@/lib/rag";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const chunk = id ? getChunk(id) : undefined;
  if (!chunk) return Response.json({ error: "That note is not on this desk." }, { status: 404 });
  return Response.json({
    id: chunk.id,
    title: chunk.title,
    source: chunk.source,
    excerpt: chunk.body.replace(/\s+/g, " ").trim().slice(0, 280),
  });
}
