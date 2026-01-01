import type { ReactElement } from 'react'
import { MDXRemote } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import { Callout } from '@/components/docs/Callout'
import { Checklist } from '@/components/docs/Checklist'
import { DocBlock } from '@/components/docs/DocBlock'
import { MiniChallenge } from '@/components/docs/MiniChallenge'
import { CodeBlock } from '@/components/docs/CodeBlock'
import { MicroPracticePanel } from '@/components/MicroPracticePanel'
import { Playground } from '@/components/playground/Playground'

type MicroQuestion = {
  id: number
  prompt: string
  type: 'mcq' | 'code_output' | 'code_complete' | 'code'
  choicesJson?: { id: string; text: string }[] | null
  answer: string
  answerDocBlockAnchor: string | null
}

type DocScrollbookProps = {
  source: string
  microQuestions: MicroQuestion[]
}

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

export function DocScrollbook({ source, microQuestions }: DocScrollbookProps) {
  const components = {
    Callout,
    Checklist,
    MiniChallenge,
    Playground,
    pre: Pre,
    code: (props: any) => (
      <code className="rounded bg-sky-100 px-1.5 py-0.5 text-sm text-slate-800" {...props} />
    ),
    DocBlock: ({ anchor, kind, title, children }: any) => {
      const matching = microQuestions.filter((q) => q.answerDocBlockAnchor === anchor)
      return (
        <DocBlock anchor={anchor} kind={kind} title={title}>
          {children}
          {matching.length > 0 ? <MicroPracticePanel questions={matching} /> : null}
        </DocBlock>
      )
    },
  }

  return (
    <MDXRemote
      source={source}
      components={components}
      options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
    />
  )
}
