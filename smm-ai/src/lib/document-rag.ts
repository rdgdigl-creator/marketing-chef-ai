const CHUNK_SIZE = 1200;
const CHUNK_OVERLAP = 150;
const MAX_CHUNKS_IN_CONTEXT = 6;

export type DocumentChunk = {
  index: number;
  content: string;
};

export function splitIntoChunks(text: string): DocumentChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const chunks: DocumentChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < normalized.length) {
    let end = Math.min(start + CHUNK_SIZE, normalized.length);

    if (end < normalized.length) {
      const paragraphBreak = normalized.lastIndexOf("\n\n", end);
      const sentenceBreak = normalized.lastIndexOf(". ", end);
      const breakAt = Math.max(paragraphBreak, sentenceBreak);
      if (breakAt > start + CHUNK_SIZE * 0.4) {
        end = breakAt + 1;
      }
    }

    const content = normalized.slice(start, end).trim();
    if (content) {
      chunks.push({ index, content });
      index += 1;
    }

    if (end >= normalized.length) break;
    start = Math.max(end - CHUNK_OVERLAP, start + 1);
  }

  return chunks;
}

function tokenize(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word.length > 2);
}

export function retrieveRelevantChunks(
  chunks: DocumentChunk[],
  query: string,
  limit = MAX_CHUNKS_IN_CONTEXT,
): DocumentChunk[] {
  if (!chunks.length) return [];

  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return chunks.slice(0, limit);
  }

  const scored = chunks.map((chunk) => {
    const lower = chunk.content.toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (lower.includes(token)) score += 1;
    }
    return { chunk, score };
  });

  scored.sort((a, b) => b.score - a.score || a.chunk.index - b.chunk.index);

  const withHits = scored.filter((item) => item.score > 0);
  const selected = (withHits.length > 0 ? withHits : scored)
    .slice(0, limit)
    .map((item) => item.chunk)
    .sort((a, b) => a.index - b.index);

  return selected;
}

export function buildRagContext(params: {
  fileName: string;
  documentText: string;
  analysisJson: string;
  query: string;
  storedChunks?: DocumentChunk[];
}): string {
  const chunks =
    params.storedChunks?.length
      ? params.storedChunks
      : splitIntoChunks(params.documentText);

  const relevant = retrieveRelevantChunks(chunks, params.query);

  const fragmentBlock =
    relevant.length > 0
      ? relevant.map((c) => `[Фрагмент ${c.index + 1}]\n${c.content}`).join("\n\n")
      : params.documentText.slice(0, 4000);

  return `Документ: «${params.fileName}»

=== РЕЗУЛЬТАТЫ АНАЛИЗА ===
${params.analysisJson}

=== РЕЛЕВАНТНЫЕ ФРАГМЕНТЫ ДОКУМЕНТА ===
${fragmentBlock}`;
}
