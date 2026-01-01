import fs from 'node:fs/promises'
import path from 'node:path'

export async function loadMdxSource(mdxPath: string) {
  const absolute = path.join(process.cwd(), mdxPath)
  return fs.readFile(absolute, 'utf8')
}
