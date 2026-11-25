export function chunkText(text: string, size = 28): string[] {
  if (!text) return [""];
  const parts: string[] = [];
  for (let index = 0; index < text.length; index += size) parts.push(text.slice(index, index + size));
  return parts;
}
