import { readFileSync } from 'node:fs'
import { join } from 'node:path'

interface KnowledgeChunk {
  source: string
  content: string
}

function loadKnowledge(): KnowledgeChunk[] {
  const knowledgeDir = join(process.cwd(), 'src/lib/knowledge')
  const files = ['rooms.md', 'policies.md', 'services.md', 'faq.md']
  return files.map((file) => ({
    source: file.replace('.md', ''),
    content: readFileSync(join(knowledgeDir, file), 'utf-8'),
  }))
}

const CHUNKS: KnowledgeChunk[] = loadKnowledge()
const MAX_CONTEXT_CHARS = 3800

export function retrieveContext(query: string): string {
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)

  if (queryWords.length === 0) {
    return CHUNKS.map((c) => c.content)
      .join('\n\n---\n\n')
      .slice(0, MAX_CONTEXT_CHARS)
  }

  const scored = CHUNKS.map((chunk) => {
    const contentLower = chunk.content.toLowerCase()
    const score = queryWords.reduce(
      (acc, word) => acc + (contentLower.includes(word) ? 1 : 0),
      0,
    )
    return { ...chunk, score }
  })

  const relevant = scored
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

  const source = relevant.length > 0 ? relevant : CHUNKS
  return source
    .map((c) => c.content)
    .join('\n\n---\n\n')
    .slice(0, MAX_CONTEXT_CHARS)
}
