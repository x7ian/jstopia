import type { ReactElement } from 'react'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { loadMdx } from '@/lib/docs/loadMdx'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { Callout } from '@/components/docs/Callout'
import { CodeBlock } from '@/components/docs/CodeBlock'
import { DocBlock } from '@/components/docs/DocBlock'
import { Checklist } from '@/components/docs/Checklist'
import { MiniChallenge } from '@/components/docs/MiniChallenge'
import { DocAnchorHighlighter } from '@/components/docs/DocAnchorHighlighter'
import { Playground } from '@/components/playground/Playground'
import { cn } from '@/lib/utils'

function Pre({ children }: { children: React.ReactNode }) {
  const child = children as ReactElement | undefined
  const code = typeof child?.props?.children === 'string' ? child.props.children : ''
  const className = typeof child?.props?.className === 'string' ? child.props.className : ''
  const language = className.replace('language-', '')

  if (code) {
    return <CodeBlock code={code} language={language} />
  }

  return <pre>{children}</pre>
}

export default async function DocPage(props: { params: Promise<{ docPageSlug: string }> }) {
  const params = await props.params
  const slug = params.docPageSlug

  const page = await prisma.docPage.findUnique({
    where: { slug },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })

  if (!page) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-12">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-900">
          Doc page not found.
        </div>
      </div>
    )
  }

  const source = await loadMdx(page.mdxPath)

  const components = {
    Callout,
    DocBlock,
    Checklist,
    MiniChallenge,
    Playground,
    pre: Pre,
    code: (props: any) => (
      <code className="rounded bg-sky-100 px-1.5 py-0.5 text-sm text-slate-800" {...props} />
    ),
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <DocAnchorHighlighter />
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Docs</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">{page.title}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <article
          className={cn(
            'rounded-3xl border border-sky-200/70 bg-white/90 p-8 text-base leading-relaxed text-slate-800 shadow-sm'
          )}
        >
          <MDXRemote
            source={source}
            components={components}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-10 rounded-3xl border border-sky-200/70 bg-white/90 p-5 text-sm text-slate-700 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">On this page</p>
            <div className="mt-4 space-y-2">
              {page.blocks.map((block) => (
                <Link
                  key={block.id}
                  href={`#${block.anchor}`}
                  className="block rounded-xl border border-transparent px-3 py-2 text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                >
                  {block.title ?? block.anchor}
                </Link>
              ))}
              {page.blocks.length === 0 ? (
                <p className="text-xs text-slate-500">No doc blocks yet.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
