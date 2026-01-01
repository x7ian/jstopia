import { loadMdxSource } from '@/lib/mdx/loadMdx'

export async function loadMdx(mdxPath: string) {
  const source = await loadMdxSource(mdxPath)
  if (source.startsWith('---')) {
    const end = source.indexOf('\n---', 3)
    if (end !== -1) {
      return source.slice(end + 4).trimStart()
    }
  }
  return source
}
