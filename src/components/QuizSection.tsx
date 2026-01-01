'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { HelpButton } from '@/components/quiz/HelpButton'
import { Playground, type PlaygroundHandle } from '@/components/playground/Playground'
import { scrollToAnchor } from '@/lib/docs/scrollToAnchor'
import { cn } from '@/lib/utils'

type QuizQuestion = {
  id: number
  type: 'mcq' | 'code_output' | 'code_complete' | 'code'
  prompt: string
  code?: string | null
  difficulty: 'basic' | 'medium' | 'advanced'
  phase: 'micro' | 'quiz' | 'boss'
  choices?: { id: string; text: string }[] | null
  tip1?: string | null
  tip2?: string | null
  files?: { name: string; language: 'html' | 'css' | 'js'; content: string }[] | null
  expected?: { mode: 'consoleIncludes' | 'domTextEquals'; value: string } | null
  doc?: {
    pageSlug: string
    answerBlock: { id: number; anchor: string; title?: string | null; kind?: string | null } | null
  } | null
}

type QuizSectionProps = {
  topicSlug: string
  sessionToken: string | null
  mode: 'learn' | 'challenge'
  quizCount: number
  phase?: 'micro' | 'quiz' | 'boss'
  rankSlug?: string | null
  helpLimits?: {
    maxTipCount?: number
    maxDocCount?: number
    allowDoc?: boolean
  }
  onProgress?: (answered: number) => void
  onHudUpdate?: (data: {
    masteryHalfSteps: number
    correctCount: number
    wrongCount: number
    streak: number
    quizIndex: number
    quizTotal: number
    totalScore: number
    topicScore: number
    lastDelta?: number
  }) => void
  onComplete?: (summary: {
    correctCount: number
    answered: number
    totalScore: number
    tipUsed: number
    docUsed: number
    masteryHalfSteps: number
  }) => void
}

export function QuizSection({
  topicSlug,
  sessionToken,
  mode,
  quizCount,
  phase = 'quiz',
  rankSlug,
  helpLimits,
  onProgress,
  onHudUpdate,
  onComplete,
}: QuizSectionProps) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [selected, setSelected] = useState('')
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null)
  const [explanation, setExplanation] = useState<string | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [masteryHalfSteps, setMasteryHalfSteps] = useState(0)
  const [tipUsedCount, setTipUsedCount] = useState(0)
  const [docUsedCount, setDocUsedCount] = useState(0)
  const [helpMessage, setHelpMessage] = useState<string | null>(null)
  const [teleportAnchor, setTeleportAnchor] = useState<string | null>(null)
  const [helpLevel, setHelpLevel] = useState<'none' | 'tip' | 'doc'>('none')
  const [loading, setLoading] = useState(false)
  const [totalScore, setTotalScore] = useState(0)
  const [topicScore, setTopicScore] = useState(0)
  const [lastDelta, setLastDelta] = useState<number | undefined>(undefined)
  const [xpVisible, setXpVisible] = useState(false)
  const [completed, setCompleted] = useState(false)
  const playgroundRef = useRef<PlaygroundHandle | null>(null)

  const tip = useMemo(() => {
    if (helpLevel === 'tip') return question?.tip1 ?? null
    if (helpLevel === 'doc') return question?.tip2 ?? question?.tip1 ?? null
    return null
  }, [helpLevel, question?.tip1, question?.tip2])

  const hasAnchor = Boolean(question?.doc?.answerBlock?.anchor)
  const allowDoc = helpLimits?.allowDoc ?? true
  const helpLabel =
    helpLevel === 'none'
      ? 'Tip'
      : helpLevel === 'tip'
        ? hasAnchor && allowDoc
          ? 'View Docs'
          : 'Hide Tip'
        : 'Hide Tip'

  useEffect(() => {
    if (!sessionToken) return
    resetRunState()
    loadQuestion()
  }, [sessionToken, topicSlug, mode, phase, rankSlug])

  useEffect(() => {
    if (!question) return
    const quizIndex = Math.min(quizCount, answeredCount + 1)
    onHudUpdate?.({
      masteryHalfSteps,
      correctCount,
      wrongCount,
      streak,
      quizIndex: quizCount > 0 ? quizIndex : 0,
      quizTotal: quizCount,
      totalScore,
      topicScore,
      lastDelta,
    })
  }, [
    question,
    answeredCount,
    quizCount,
    masteryHalfSteps,
    correctCount,
    wrongCount,
    streak,
    totalScore,
    topicScore,
    lastDelta,
    onHudUpdate,
  ])

  function resetRunState() {
    setAnsweredCount(0)
    setCorrectCount(0)
    setWrongCount(0)
    setStreak(0)
    setMasteryHalfSteps(0)
    setCompleted(false)
    setLastDelta(undefined)
    setTipUsedCount(0)
    setDocUsedCount(0)
    setHelpMessage(null)
    onHudUpdate?.({
      masteryHalfSteps: 0,
      correctCount: 0,
      wrongCount: 0,
      streak: 0,
      quizIndex: 0,
      quizTotal: quizCount,
      totalScore,
      topicScore,
      lastDelta: undefined,
    })
  }

  async function loadQuestion() {
    if (!sessionToken) return
    setLoading(true)
    const params = new URLSearchParams()
    params.set('sessionToken', sessionToken)
    params.set('phase', phase)
    if (topicSlug) params.set('topicSlug', topicSlug)
    if (rankSlug) params.set('rankSlug', rankSlug)
    const res = await fetch(`/api/quiz/next?${params.toString()}`)
    const json = await res.json()
    if (res.ok) {
      setQuestion(json?.data?.question ?? null)
      setSelected('')
      setResult(null)
      setExplanation(null)
      setTeleportAnchor(null)
      setHelpLevel('none')
      setHelpMessage(null)
    }
    setLoading(false)
  }

  async function handleAnswer(value: string) {
    if (!sessionToken || !question || completed) return
    setSelected(value)

    const helpUsed = helpLevel === 'doc' ? 'doc' : helpLevel === 'tip' ? 'tip' : 'none'
    const res = await fetch('/api/quiz/answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        questionId: question.id,
        selected: value,
        helpUsed,
        tipCount: helpUsed === 'tip' ? 1 : 0,
      }),
    })
    const json = await res.json()
    if (!res.ok) return

    const correct = !!json?.data?.correct
    const scoreDelta = json?.data?.scoreDelta ?? 0
    const updatedTotal = json?.data?.totalScore ?? totalScore
    const updatedTopicScore = json?.data?.topicScore ?? topicScore
    setResult(correct ? 'correct' : 'incorrect')
    setExplanation(json?.data?.explanation ?? null)
    setTeleportAnchor(json?.data?.teleport?.anchor ?? null)
    setTotalScore(updatedTotal)
    setTopicScore(updatedTopicScore)
    setLastDelta(scoreDelta > 0 ? scoreDelta : undefined)
    if (scoreDelta > 0) {
      setXpVisible(true)
      window.setTimeout(() => setXpVisible(false), 900)
    }

    const nextAnswered = answeredCount + 1
    const nextCorrect = correct ? correctCount + 1 : correctCount
    const nextWrong = correct ? wrongCount : wrongCount + 1
    const nextStreak = correct ? streak + 1 : 0
    const nextMastery = Math.max(
      0,
      Math.min(10, masteryHalfSteps + (correct ? 2 : -1))
    )
    const nextTipUsed = helpUsed === 'tip' ? tipUsedCount + 1 : tipUsedCount
    const nextDocUsed = helpUsed === 'doc' ? docUsedCount + 1 : docUsedCount

    setAnsweredCount(nextAnswered)
    setCorrectCount(nextCorrect)
    setWrongCount(nextWrong)
    setStreak(nextStreak)
    setMasteryHalfSteps(nextMastery)
    setTipUsedCount(nextTipUsed)
    setDocUsedCount(nextDocUsed)
    onProgress?.(nextAnswered)
    onHudUpdate?.({
      masteryHalfSteps: nextMastery,
      correctCount: nextCorrect,
      wrongCount: nextWrong,
      streak: nextStreak,
      quizIndex: Math.min(quizCount, nextAnswered + 1),
      quizTotal: quizCount,
      totalScore: updatedTotal,
      topicScore: updatedTopicScore,
      lastDelta: scoreDelta > 0 ? scoreDelta : undefined,
    })

    if (!completed && quizCount > 0 && nextAnswered >= quizCount) {
      setCompleted(true)
      onComplete?.({
        correctCount: nextCorrect,
        answered: nextAnswered,
        totalScore: json?.data?.totalScore ?? totalScore,
        tipUsed: nextTipUsed,
        docUsed: nextDocUsed,
        masteryHalfSteps: nextMastery,
      })
    }
  }

  function handleNext() {
    if (!result || completed) return
    loadQuestion()
  }

  async function handleCodeCheck() {
    if (!question || question.type !== 'code' || !playgroundRef.current || !question.expected) return
    const runResult = await playgroundRef.current.run()
    const logText = runResult.logs.map((entry) => entry.message).join('\n')
    const hasErrors = runResult.errors.length > 0
    const expectedValue = question.expected.value.trim()

    const passed =
      !hasErrors &&
      (question.expected.mode === 'consoleIncludes'
        ? logText.includes(expectedValue)
        : runResult.resultText.trim() === expectedValue)

    await handleAnswer(passed ? question.answer : '__incorrect__')
  }

  function handleHelpToggle() {
    const anchor = question?.doc?.answerBlock?.anchor ?? null
    const allowDoc = helpLimits?.allowDoc ?? true
    const maxTipCount = helpLimits?.maxTipCount
    const maxDocCount = helpLimits?.maxDocCount

    if (helpLevel === 'none') {
      if (maxTipCount !== undefined && tipUsedCount >= maxTipCount) {
        setHelpMessage('Trial rules: no more tips.')
        return
      }
      if (question?.tip1) {
        setHelpLevel('tip')
        setHelpMessage(null)
      } else if (anchor) {
        if (!allowDoc) {
          setHelpMessage('Trial rules: docs are disabled.')
          return
        }
        if (maxDocCount !== undefined && docUsedCount >= maxDocCount) {
          setHelpMessage('Trial rules: no more docs.')
          return
        }
        scrollToAnchor(anchor)
        setHelpLevel('doc')
        setHelpMessage(null)
      }
      return
    }

    if (helpLevel === 'tip') {
      if (anchor) {
        if (!allowDoc) {
          setHelpMessage('Trial rules: docs are disabled.')
          return
        }
        if (maxDocCount !== undefined && docUsedCount >= maxDocCount) {
          setHelpMessage('Trial rules: no more docs.')
          return
        }
        scrollToAnchor(anchor)
        setHelpLevel('doc')
        setHelpMessage(null)
      } else {
        setHelpLevel('none')
        setHelpMessage(null)
      }
      return
    }

    setHelpLevel('none')
    setHelpMessage(null)
  }

  return (
    <section id="quiz" className="scroll-mt-24">
      <div className="rounded-3xl border border-sky-200/70 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Quiz</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Test your understanding</h2>
            <p className="mt-2 text-sm text-slate-600">
              {mode === 'challenge'
                ? 'Challenge mode starts here. Wrong answers can teleport you to the explanation.'
                : 'Read through the scrollbook, then clear the quiz.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <HelpButton onClick={handleHelpToggle} active={helpLevel !== 'none'} label={helpLabel} />
          </div>
        </div>
        <div className="relative">
          <div
            className={cn(
              'pointer-events-none absolute right-4 top-4 rounded-full border border-emerald-200 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 shadow-sm transition-all',
              xpVisible ? 'opacity-100 -translate-y-1' : 'opacity-0 translate-y-1'
            )}
          >
            +{lastDelta ?? 0} XP
          </div>
        </div>

        {helpMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">
            {helpMessage}
          </div>
        ) : null}

        {tip ? (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            {tip}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Loading question…</p>
        ) : !question ? (
          <p className="mt-6 text-sm text-slate-600">No quiz questions available.</p>
        ) : (
          <div className="mt-6 space-y-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Question</p>
            <h3 className="text-xl font-semibold text-slate-900">{question.prompt}</h3>
            {question.code ? (
              <pre className="overflow-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm text-emerald-200">
                <code>{question.code}</code>
              </pre>
            ) : null}

            {question.type === 'mcq' && question.choices ? (
              <div className="grid gap-3">
                {question.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleAnswer(choice.id)}
                    disabled={!!result}
                    className={cn(
                      'rounded-2xl border border-sky-200/70 bg-white/70 px-4 py-3 text-left text-sm text-slate-800 transition hover:border-sky-300',
                      selected === choice.id && 'border-emerald-300 bg-emerald-50'
                    )}
                  >
                    {choice.text}
                  </button>
                ))}
              </div>
            ) : question.type === 'code' && Array.isArray(question.files) ? (
              <div className="space-y-3">
                <Playground
                  ref={playgroundRef}
                  title="Challenge"
                  files={question.files}
                  showPreview={false}
                  height={360}
                  previewHeight={220}
                />
                <button
                  type="button"
                  onClick={handleCodeCheck}
                  disabled={!!result}
                  className="rounded-full border border-emerald-300 bg-emerald-200/70 px-6 py-2 text-sm font-semibold text-emerald-900"
                >
                  Check Answer
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={selected}
                  onChange={(event) => setSelected(event.target.value)}
                  placeholder="Type your answer"
                  className="w-full rounded-2xl border border-sky-200/70 bg-white/80 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => handleAnswer(selected)}
                  disabled={selected.trim().length === 0 || !!result}
                  className="rounded-full border border-emerald-300 bg-emerald-200/70 px-6 py-2 text-sm font-semibold text-emerald-900"
                >
                  Submit Answer
                </button>
              </div>
            )}

            {result ? (
              <div
                className={cn(
                  'rounded-2xl border px-4 py-3 text-sm',
                  result === 'correct'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : 'border-rose-300 bg-rose-50 text-rose-900'
                )}
              >
                <p className="font-semibold">{result === 'correct' ? 'Correct!' : 'Not quite yet.'}</p>
                {explanation ? <p className="mt-2 text-slate-700">{explanation}</p> : null}
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {result === 'incorrect' && teleportAnchor ? (
                    <button
                      type="button"
                      onClick={() => scrollToAnchor(teleportAnchor)}
                      className="rounded-full border border-amber-300 bg-amber-200/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-900"
                    >
                      Teleport to explanation
                    </button>
                  ) : null}
                  {!completed ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="rounded-full border border-sky-200 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700"
                    >
                      Next Question
                    </button>
                  ) : (
                    <div className="rounded-full border border-emerald-300 bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-900">
                      Quiz complete • Score {totalScore}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </section>
  )
}
