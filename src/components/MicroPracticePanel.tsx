'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type MicroQuestion = {
  id: number
  prompt: string
  type: 'mcq' | 'code_output' | 'code_complete' | 'code'
  choicesJson?: { id: string; text: string }[] | null
  answer: string
}

type MicroPracticePanelProps = {
  questions: MicroQuestion[]
}

export function MicroPracticePanel({ questions }: MicroPracticePanelProps) {
  const question = questions[0]
  const [selected, setSelected] = useState<string | null>(null)
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)

  const choices = useMemo(() => question?.choicesJson ?? [], [question])

  if (!question) return null

  function handleSelect(choiceId: string) {
    if (result) return
    setSelected(choiceId)
    setResult(choiceId === question.answer ? 'correct' : 'incorrect')
  }

  return (
    <div className="mt-6 rounded-2xl border border-sky-200/70 bg-white/80 p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Micro Practice</p>
      <p className="mt-2 text-sm text-slate-800">{question.prompt}</p>
      {question.type === 'mcq' && choices.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {choices.map((choice) => (
            <button
              key={choice.id}
              type="button"
              onClick={() => handleSelect(choice.id)}
              className={cn(
                'rounded-xl border border-sky-200/70 bg-white/70 px-3 py-2 text-left text-xs text-slate-800 transition hover:border-sky-300',
                selected === choice.id && 'border-emerald-300 bg-emerald-50'
              )}
            >
              {choice.text}
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">Code-output micro practice is coming soon.</p>
      )}
      {result ? (
        <p className={cn(
          'mt-3 text-xs font-semibold',
          result === 'correct' ? 'text-emerald-600' : 'text-rose-600'
        )}>
          {result === 'correct' ? 'Nice! You got it.' : 'Not quite. Re-read and try again.'}
        </p>
      ) : null}
    </div>
  )
}
