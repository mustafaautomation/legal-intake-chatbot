import fs from "fs";
import path from "path";

export interface Chunk {
  id: string;
  title: string;
  source: string;
  generalInfo: boolean;
  body: string;
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "in", "on", "at", "is", "are", "was", "be", "this", "that",
  "with", "as", "by", "from", "it", "we", "our", "you", "your", "do", "does", "what", "how", "who", "when",
  "where", "can", "i", "me", "my", "about", "please", "have", "has",
]);

let cache: Chunk[] | null = null;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOP.has(token));
}

export function loadChunks(): Chunk[] {
  const dir = path.join(process.cwd(), "kb");
  const files = fs.readdirSync(dir).filter((file) => file.endsWith(".md")).sort();
  const chunks: Chunk[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) continue;
    const meta = Object.fromEntries(
      match[1]
        .split("\n")
        .map((line) => line.split(":").map((part) => part.trim()))
        .filter((pair) => pair.length >= 2)
        .map(([key, ...rest]) => [key, rest.join(":")]),
    );
    const generalInfo = meta.generalInfo === "true";
    const source = meta.source ?? "Firm notes";
    const sections = match[2].split(/\n(?=## )/).map((section) => section.trim()).filter(Boolean);
    sections.forEach((section, index) => {
      const lines = section.split("\n");
      const title = lines[0].replace(/^##\s+/, "").trim();
      const body = lines.slice(1).join("\n").trim();
      chunks.push({
        id: `${meta.id ?? file}-${index}`,
        title,
        source,
        generalInfo,
        body,
      });
    });
  }
  return chunks;
}

export function getChunks(): Chunk[] {
  if (!cache) cache = loadChunks();
  return cache;
}

export interface ScoredChunk {
  chunk: Chunk;
  score: number;
  coverage: number;
  embedding: number;
}

/** Local hashed embedding. No model download and no paid API. */
export function hashEmbed(tokens: string[]): Float64Array {
  const vector = new Float64Array(64);
  for (const token of tokens) {
    let hash = 2166136261;
    for (let i = 0; i < token.length; i += 1) {
      hash = Math.imul(hash ^ token.charCodeAt(i), 16777619);
    }
    const index = Math.abs(hash) % vector.length;
    vector[index] += (hash & 1) === 0 ? 1 : -1;
  }
  let norm = 0;
  for (const value of vector) norm += value * value;
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < vector.length; i += 1) vector[i] /= norm;
  return vector;
}

function cosine(left: Float64Array, right: Float64Array): number {
  let sum = 0;
  for (let i = 0; i < left.length; i += 1) sum += left[i] * right[i];
  return sum;
}

export function searchKb(query: string, k = 3): ScoredChunk[] {
  const chunks = getChunks();
  const queryTokens = tokenize(query);
  const queryVector = hashEmbed(queryTokens);
  const docs = chunks.map((chunk) => tokenize(`${chunk.title} ${chunk.title} ${chunk.body}`));
  const vectors = docs.map((doc) => hashEmbed(doc));
  const avg = docs.reduce((sum, doc) => sum + doc.length, 0) / Math.max(docs.length, 1);
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const token of new Set(doc)) df.set(token, (df.get(token) ?? 0) + 1);
  }
  const k1 = 1.2;
  const b = 0.75;
  const raw = chunks.map((chunk, index) => {
    const doc = docs[index];
    const tf = new Map<string, number>();
    for (const token of doc) tf.set(token, (tf.get(token) ?? 0) + 1);
    let bm25 = 0;
    let matched = 0;
    for (const token of queryTokens) {
      const freq = tf.get(token) ?? 0;
      if (!freq) continue;
      matched += 1;
      const n = df.get(token) ?? 0;
      const idf = Math.log(1 + (chunks.length - n + 0.5) / (n + 0.5));
      bm25 += idf * ((freq * (k1 + 1)) / (freq + k1 * (1 - b + b * (doc.length / avg))));
    }
    const coverage = matched / Math.max(queryTokens.length, 1);
    const embedding = Math.max(0, cosine(queryVector, vectors[index]));
    return { chunk, bm25: bm25 * (0.2 + coverage), coverage, embedding };
  });
  const maxBm25 = Math.max(...raw.map((item) => item.bm25), 1e-6);
  return raw
    .map((item) => ({
      chunk: item.chunk,
      coverage: item.coverage,
      embedding: item.embedding,
      score: 0.75 * (item.bm25 / maxBm25) + 0.25 * item.embedding,
    }))
    .filter((item) => item.score > 0.05)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function excerptOf(body: string): string {
  const clean = body.replace(/[#*_]/g, "").replace(/\s+/g, " ").trim();
  const sentence = clean.match(/^(.+?[.])(?:\s|$)/);
  const text = sentence?.[1] ?? clean.slice(0, 180);
  return text.length > 180 ? `${text.slice(0, 177).trim()}…` : text;
}

export function getChunk(id: string): Chunk | undefined {
  return getChunks().find((chunk) => chunk.id === id);
}

export function renderKbAnswer(query: string): {
  text: string;
  citations: Array<{ id: string; title: string; source: string; excerpt?: string }>;
  confident: boolean;
  coverage: number;
} {
  const hits = searchKb(query, 2);
  const top = hits[0];
  const confident = Boolean(top && top.coverage >= 0.34 && top.score >= 0.45);
  if (!top || !confident) {
    return {
      text: "I don't have a firm note that answers that with enough confidence.",
      citations: [],
      confident: false,
      coverage: top?.coverage ?? 0,
    };
  }
  const lead = top.chunk.generalInfo
    ? "General information only. This is not a deadline for your case, and it is not a conclusion about anyone’s situation.\n\n"
    : "";
  const text = `${lead}${top.chunk.body}\n\nSource: ${top.chunk.title} · ${top.chunk.source}`;
  return {
    text,
    citations: [{ id: top.chunk.id, title: top.chunk.title, source: top.chunk.source, excerpt: excerptOf(top.chunk.body) }],
    confident: true,
    coverage: top.coverage,
  };
}
