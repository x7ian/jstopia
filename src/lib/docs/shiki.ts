import { getHighlighter, type Highlighter } from 'shiki'

let highlighterPromise: Promise<Highlighter> | null = null

async function getSingletonHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = getHighlighter({ theme: 'github-dark' })
  }
  return highlighterPromise
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

export async function highlightCode(code: string, language?: string) {
  const trimmed = code.trimEnd()
  const lang = (language || 'text').replace(/^language-/, '')
  try {
    const highlighter = await getSingletonHighlighter()
    const html = highlighter.codeToHtml(trimmed, { lang: lang as any })
    return { html, language: lang }
  } catch {
    const html = `<pre class=\"shiki\"><code>${escapeHtml(trimmed)}</code></pre>`
    return { html, language: lang }
  }
}
