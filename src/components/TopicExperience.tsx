'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { QuizSection } from '@/components/QuizSection'
import { TopicHUD } from '@/components/game/TopicHUD'
import { UserMenu } from '@/components/UserMenu'
import { RankUpModal } from '@/components/game/RankUpModal'
import { StickyTopicControls } from '@/components/StickyTopicControls'
import { DocAnchorHighlighter } from '@/components/docs/DocAnchorHighlighter'
import { Playground } from '@/components/playground/Playground'
import type { PlaygroundFile } from '@/components/playground/iframeBridge'
import { applyAnswerResult, loadStreakState } from '@/lib/game/streak'
import { getStoredSessionToken, setStoredSessionToken } from '@/lib/session'
import { scrollToId } from '@/lib/scroll'
import { scrollToAnchor } from '@/lib/docs/scrollToAnchor'
import { cn } from '@/lib/utils'

type TopicExperienceProps = {
  topic: { slug: string; title: string; storyIntro?: string | null }
  chapter: { title: string }
  book: { title: string; slug: string }
  doc: { title: string; objectives: string[]; estimatedMinutes?: number | null } | null
  docContent?: React.ReactNode
  docContentWithMicro?: React.ReactNode
  docBlocks: {
    id: number
    anchor: string
    title?: string | null
    kind?: string | null
    excerpt?: string | null
    taskQuestionId?: number | null
  }[]
  taskQuestions?: {
    id: number
    type: 'mcq' | 'code_output' | 'code_complete' | 'code'
    phase?: string | null
    filesJson?: { name: string; language: 'html' | 'css' | 'js'; content: string }[] | null
    expectedJson?: { mode: 'consoleIncludes' | 'domTextEquals' | 'noConsoleErrors'; value?: string } | null
  }[]
  microQuestions: {
    id: number
    prompt: string
    type: 'mcq' | 'code_output' | 'code_complete' | 'code'
    choicesJson?: { id: string; text: string }[] | null
    answer: string
    tip1?: string | null
    tip2?: string | null
    filesJson?: { name: string; language: 'html' | 'css' | 'js'; content: string }[] | null
    expectedJson?: { mode: 'consoleIncludes' | 'domTextEquals' | 'noConsoleErrors'; value?: string } | null
    answerDocBlockAnchor: string | null
  }[]
  nav: { nextTopicSlug?: string | null }
  quizCount: number
}

type WeakSpot = { anchor: string; title: string; wrongCount: number }
type RankState = {
  rankSlug?: string
  currentRank: { slug: string; title: string; description: string }
  nextRank: {
    slug: string
    title: string
    description: string
    xpMin: number
    xpProgressPct: number
    comingSoon?: boolean
  } | null
  totalXp: number
}

const STORAGE_KEY = 'jsquest-topic-mode'
const RANK_STORAGE_KEY = 'jsopia.rankSlug'
const PROLOGUE_READ_ONLY_SLUGS = new Set([
  'prologue-welcome',
  'prologue-browser-wars',
  'prologue-where-js-lives',
])

export function TopicExperience({
  topic,
  chapter,
  book,
  doc,
  docContent,
  docContentWithMicro,
  docBlocks,
  taskQuestions = [],
  microQuestions,
  nav,
  quizCount,
}: TopicExperienceProps) {
  const [mode, setMode] = useState<'learn' | 'challenge'>('learn')
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [readPercent, setReadPercent] = useState(0)
  const [quizAnswered, setQuizAnswered] = useState(0)
  const [showMenu, setShowMenu] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hud, setHud] = useState({
    masteryHalfSteps: 0,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    microStreak: 0,
    quizStreak: 0,
    shieldCount: 0,
    hintTokens: 0,
    quizIndex: 0,
    quizTotal: quizCount,
    totalScore: 0,
    topicScore: 0,
    lastDelta: undefined as number | undefined,
  })
  const [summary, setSummary] = useState<{
    correctCount: number
    answered: number
    totalScore: number
    tipUsed: number
    docUsed: number
    masteryHalfSteps?: number
  } | null>(null)
  const [weakSpots, setWeakSpots] = useState<WeakSpot[]>([])
  const [autoScrolled, setAutoScrolled] = useState(false)
  const [rankState, setRankState] = useState<RankState | null>(null)
  const [showRankModal, setShowRankModal] = useState(false)
  const [rankModalData, setRankModalData] = useState<{
    previous: string
    current: string
    description?: string
    slug?: string
  } | null>(null)
  const docRef = useRef<HTMLDivElement | null>(null)
  const docContentRef = useRef<HTMLDivElement | null>(null)
  const flowCardRef = useRef<HTMLDivElement | null>(null)
  const [viewMode, setViewMode] = useState<'coverage' | 'scroll'>('coverage')
  const [showModeToggle, setShowModeToggle] = useState(false)
  const [mobileTab, setMobileTab] = useState<'lesson' | 'code'>('lesson')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editorOpen, setEditorOpen] = useState(true)
  const [editorFilesByStep, setEditorFilesByStep] = useState<Record<string, PlaygroundFile[]>>({})
  const [flowIndex, setFlowIndex] = useState(0)
  const [flowStatus, setFlowStatus] = useState<'idle' | 'correct' | 'incorrect'>('idle')
  const [flowSelected, setFlowSelected] = useState<string | null>(null)
  const [flowShowTip2, setFlowShowTip2] = useState(false)
  const [flowXpDelta, setFlowXpDelta] = useState<number | null>(null)
  const [headStartPips, setHeadStartPips] = useState(0)
  const [microProgressRaw, setMicroProgressRaw] = useState(0)
  const [microProgressHalfSteps, setMicroProgressHalfSteps] = useState(0)
  const [microCorrectQuestionIds, setMicroCorrectQuestionIds] = useState<Set<number>>(new Set())
  const [microStreak, setMicroStreak] = useState(0)
  const [completedAnchors, setCompletedAnchors] = useState<Set<string>>(new Set())
  const playgroundRef = useRef<import('@/components/playground/Playground').PlaygroundHandle | null>(null)
  const lessonCompletionSent = useRef(false)

  const orderedBlocks = useMemo(() => docBlocks ?? [], [docBlocks])
  const taskQuestionById = useMemo(() => {
    return new Map(taskQuestions.map((question) => [question.id, question]))
  }, [taskQuestions])
  const microHalfStepsPerCorrect = useMemo(() => {
    if (!microQuestions.length) return 0
    return 3 / microQuestions.length
  }, [microQuestions.length])
  const flowSteps = useMemo(() => {
    const steps = [{ type: 'objectives' as const }, ...orderedBlocks.map((block) => ({ type: 'block' as const, block }))]
    if (quizCount > 0) {
      steps.push({ type: 'quiz' as const })
    }
    return steps
  }, [orderedBlocks, quizCount])
  const currentStep = flowSteps[flowIndex] ?? flowSteps[0] ?? null
  const currentBlock = currentStep?.type === 'block' ? currentStep.block : null
  const currentBlockIndex = currentBlock
    ? orderedBlocks.findIndex((block) => block.anchor === currentBlock.anchor)
    : -1
  const totalBlocks = orderedBlocks.length
  const currentMicroQuestion = useMemo(() => {
    if (!currentBlock) return null
    return microQuestions.find((question) => question.answerDocBlockAnchor === currentBlock.anchor) ?? null
  }, [currentBlock, microQuestions])
  const currentTaskQuestion = useMemo(() => {
    if (!currentBlock?.taskQuestionId) return null
    return taskQuestionById.get(currentBlock.taskQuestionId) ?? null
  }, [currentBlock?.taskQuestionId, taskQuestionById])
  const editorSourceQuestion =
    currentTaskQuestion?.type === 'code' && currentTaskQuestion.filesJson?.length
      ? currentTaskQuestion
      : currentMicroQuestion?.type === 'code' && currentMicroQuestion.filesJson?.length
        ? currentMicroQuestion
        : null
  const lastCodeStepRef = useRef<string | null>(null)
  const defaultEditorFiles = useMemo<PlaygroundFile[]>(
    () => [
      {
        name: 'main.js',
        language: 'js',
        content: '// No code challenge for this step.\n',
      },
    ],
    []
  )
  const editorStepKey = useMemo(() => {
    if (editorSourceQuestion?.type === 'code' && editorSourceQuestion.id) {
      return `q-${editorSourceQuestion.id}`
    }
    return lastCodeStepRef.current ?? 'default'
  }, [editorSourceQuestion?.id, editorSourceQuestion?.type])
  const editorFiles = useMemo(() => {
    if (editorFilesByStep[editorStepKey]) {
      return editorFilesByStep[editorStepKey]
    }
    if (editorSourceQuestion?.type === 'code' && editorSourceQuestion.filesJson?.length) {
      return editorSourceQuestion.filesJson
    }
    return defaultEditorFiles
  }, [defaultEditorFiles, editorFilesByStep, editorSourceQuestion?.filesJson, editorSourceQuestion?.type, editorStepKey])

  const hudDisplay = useMemo(() => hud, [hud])

  const quizStepIndex = flowSteps.findIndex((step) => step.type === 'quiz')
  const lastContentIndex = quizStepIndex > -1 ? quizStepIndex - 1 : flowSteps.length - 1
  const isQuizStep = currentStep?.type === 'quiz'
  const isLastContentStep = currentStep?.type === 'block' && flowIndex === lastContentIndex

  const flowLabel =
    currentStep?.type === 'objectives'
      ? 'Objectives'
      : currentStep?.type === 'quiz'
        ? 'Lesson Quiz'
        : `Lesson Step ${Math.max(1, currentBlockIndex + 1)}/${Math.max(1, totalBlocks)}`

  const isCoverageMode = viewMode === 'coverage'
  const showQuizSection = viewMode !== 'coverage' || isQuizStep
  const activeSectionAnchor =
    viewMode === 'coverage'
      ? currentStep?.type === 'objectives'
        ? '__objectives'
        : currentStep?.type === 'quiz'
          ? 'quiz'
          : currentBlock?.anchor ?? null
      : null

  const anchorToIndex = useMemo(() => {
    const entries: Array<[string, number]> = [['__objectives', 0], ...orderedBlocks.map((block, index) => [block.anchor, index + 1])]
    if (quizStepIndex > -1) {
      entries.push(['quiz', quizStepIndex])
    }
    return new Map(entries)
  }, [orderedBlocks, quizStepIndex])

  const sectionsForMenu = useMemo(() => {
    const base = [{ anchor: '__objectives', title: 'Objectives' }, ...docBlocks]
    if (quizCount > 0) {
      base.push({ anchor: 'quiz', title: 'Lesson Quiz' })
    }
    return base
  }, [docBlocks, quizCount])

  const scrollToFlowTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const handleSectionSelect = (anchor: string) => {
    if (viewMode === 'coverage') {
      setMobileTab('lesson')
      const nextIndex = anchorToIndex.get(anchor)
      if (nextIndex !== undefined) {
        setFlowIndex(nextIndex)
        setFlowStatus('idle')
        setFlowSelected(null)
        setFlowShowTip2(false)
        setFlowXpDelta(null)
      }
      scrollToFlowTop()
      return
    }
    if (anchor === '__objectives') {
      scrollToFlowTop()
      return
    }
    if (anchor === 'quiz') {
      scrollToId('quiz')
      return
    }
    scrollToAnchor(anchor)
  }

  useEffect(() => {
    if (!sessionToken || !showQuizSection) return
    const key = `jstopia:${sessionToken}:${topic.slug}:headstart`
    const stored = window.localStorage.getItem(key)
    if (stored) return
    const pips = Math.min(1.5, microProgressHalfSteps / 2)
    if (pips > 0) {
      window.localStorage.setItem(key, String(pips))
      setHeadStartPips(pips)
    }
  }, [sessionToken, showQuizSection, microProgressHalfSteps, topic.slug])

  useEffect(() => {
    if (editorSourceQuestion?.type !== 'code' || !editorSourceQuestion.filesJson?.length) return
    const stepKey = `q-${editorSourceQuestion.id}`
    lastCodeStepRef.current = stepKey
    setEditorFilesByStep((prev) => {
      if (prev[stepKey]) return prev
      return { ...prev, [stepKey]: editorSourceQuestion.filesJson as PlaygroundFile[] }
    })
  }, [editorSourceQuestion?.filesJson, editorSourceQuestion?.id, editorSourceQuestion?.type])

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'learn' || stored === 'challenge') {
      setMode(stored)
    }
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const requested = params.get('mode')
    if (requested === 'scroll') {
      setViewMode('scroll')
      setShowModeToggle(true)
      return
    }
    if (requested === 'coverage') {
      setViewMode('coverage')
      setShowModeToggle(true)
      return
    }
    if (process.env.NODE_ENV !== 'production') {
      setShowModeToggle(true)
    }
  }, [])

  useEffect(() => {
    document.body.classList.add('topic-layout')
    document.body.dataset.theme = 'forest'
    return () => {
      document.body.classList.remove('topic-layout')
      document.body.dataset.theme = 'space'
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, mode)
  }, [mode])

  useEffect(() => {
    if (mode !== 'challenge' || autoScrolled) return
    setAutoScrolled(true)
    window.setTimeout(() => scrollToId('quiz'), 150)
  }, [mode, autoScrolled])

  useEffect(() => {
    let cancelled = false

    async function startSession() {
      const existingToken = getStoredSessionToken()
      const res = await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionToken: existingToken ?? undefined }),
      })
      const json = await res.json()
      if (!res.ok) return
      const token = json?.data?.sessionToken
      if (!token || cancelled) return
      setStoredSessionToken(token)
      setSessionToken(token)
    }

    startSession()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sessionToken) return
    let cancelled = false

    async function loadRank() {
      const res = await fetch(`/api/rank?sessionToken=${sessionToken}&bookSlug=${book.slug}`)
      const json = await res.json()
      if (!res.ok || cancelled) return
      const nextState = json?.data ?? null
      setRankState(nextState)

      const currentSlug = nextState?.currentRank?.slug
      if (currentSlug && typeof window !== 'undefined') {
        const stored = window.localStorage.getItem(RANK_STORAGE_KEY)
        if (stored && stored !== currentSlug) {
          setRankModalData({
            previous: stored,
            current: nextState?.currentRank?.title ?? currentSlug,
            description: nextState?.currentRank?.description,
            slug: currentSlug,
          })
          setShowRankModal(true)
        }
        window.localStorage.setItem(RANK_STORAGE_KEY, currentSlug)
      }
    }

    loadRank()

    return () => {
      cancelled = true
    }
  }, [sessionToken, book.slug])

  useEffect(() => {
    if (!sessionToken) return
    const microState = loadStreakState(sessionToken, 'micro')
    const quizState = loadStreakState(sessionToken, 'quiz')
    setHud((prev) => ({
      ...prev,
      streak: quizState.streak,
      microStreak: microState.streak,
      quizStreak: quizState.streak,
      shieldCount: microState.shield,
      hintTokens: microState.hintTokens,
    }))
    setMicroStreak(microState.streak)
    const storedHeadStart = window.localStorage.getItem(
      `jstopia:${sessionToken}:${topic.slug}:headstart`
    )
    if (storedHeadStart) {
      const next = Number(storedHeadStart)
      if (!Number.isNaN(next)) setHeadStartPips(next)
    }
  }, [sessionToken, topic.slug])

  useEffect(() => {
    if (!sessionToken || lessonCompletionSent.current) return
    if (!PROLOGUE_READ_ONLY_SLUGS.has(topic.slug)) return
    lessonCompletionSent.current = true
    void fetch('/api/lesson/complete', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionToken, topicSlug: topic.slug }),
    })
  }, [sessionToken, topic.slug])

  useEffect(() => {
    function updateProgress() {
      const doc = docRef.current
      if (!doc) return
      const top = doc.getBoundingClientRect().top + window.scrollY
      const height = doc.offsetHeight
      const view = window.innerHeight
      if (height <= 0) return
      const cursor = window.scrollY + view * 0.35
      const raw = height <= view ? 1 : (cursor - top) / (height - view * 0.35)
      const clamped = Math.max(0, Math.min(1, raw))
      setReadPercent(Math.round(clamped * 100))
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)
    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  const progressText = useMemo(
    () => `Read ${readPercent}% • Quiz ${quizAnswered}/${quizCount}`,
    [readPercent, quizAnswered, quizCount]
  )

  useEffect(() => {
    setHud((prev) => ({ ...prev, quizTotal: quizCount }))
  }, [quizCount])

  useEffect(() => {
    if (flowSteps.length === 0) return
    if (flowIndex >= flowSteps.length) {
      setFlowIndex(0)
    }
  }, [flowIndex, flowSteps.length])

  useEffect(() => {
    if (!docContentRef.current) return
    const children = Array.from(docContentRef.current.children) as HTMLElement[]
    const sections = Array.from(docContentRef.current.querySelectorAll('[data-anchor]')) as HTMLElement[]

    if (viewMode !== 'coverage') {
      children.forEach((child) => child.classList.remove('hidden'))
      sections.forEach((section) => {
        section.classList.remove('hidden')
        section.classList.add('block')
      })
      return
    }

    children.forEach((child) => {
      if (!child.dataset.anchor) {
        child.classList.add('hidden')
      }
    })

    sections.forEach((section) => {
      const isActive = section.dataset.anchor === currentBlock?.anchor
      section.classList.toggle('hidden', !isActive)
      section.classList.toggle('block', isActive)
    })

    if (currentBlock?.anchor) {
      const active = docContentRef.current.querySelector(
        `[data-anchor="${currentBlock.anchor}"]`
      ) as HTMLElement | null
      flowCardRef.current = active
    }
  }, [currentBlock?.anchor, viewMode])

  useEffect(() => {
    if (viewMode !== 'coverage') return
    scrollToFlowTop()
  }, [currentBlock?.anchor, viewMode])

  useEffect(() => {
    if (currentMicroQuestion?.type === 'code') {
      setEditorOpen(true)
    }
  }, [currentMicroQuestion?.type])

  useEffect(() => {
    setFlowStatus('idle')
    setFlowSelected(null)
    setFlowShowTip2(false)
    setFlowXpDelta(null)
  }, [flowIndex])

  function markMicroCorrect(questionId: number, anchor: string) {
    setMicroCorrectQuestionIds((prev) => {
      if (prev.has(questionId)) return prev
      const next = new Set(prev)
      next.add(questionId)
      setMicroProgressRaw((current) => {
        const updated = current + microHalfStepsPerCorrect
        const rounded = Math.min(3, Math.round(updated))
        setMicroProgressHalfSteps(rounded)
        setHud((prevHud) => ({ ...prevHud, masteryHalfSteps: rounded }))
        return updated
      })
      return next
    })
    setCompletedAnchors((prev) => {
      if (prev.has(anchor)) return prev
      const next = new Set(prev)
      next.add(anchor)
      return next
    })
  }

  function applyFlowResult(passed: boolean, scoreDelta: number, totalScore: number, bonusXp: number) {
    setFlowStatus(passed ? 'correct' : 'incorrect')
    setFlowShowTip2(false)
    const earned = passed ? scoreDelta + bonusXp : 0
    setFlowXpDelta(earned > 0 ? earned : null)
    setHud((prev) => ({
      ...prev,
      totalScore,
      lastDelta: earned > 0 ? earned : undefined,
    }))
    const streakUpdate = applyAnswerResult({ sessionToken, scope: 'micro', correct: passed })
    setMicroStreak(streakUpdate.state.streak)
    setHud((prev) => ({
      ...prev,
      microStreak: streakUpdate.state.streak,
      shieldCount: streakUpdate.state.shield,
      hintTokens: streakUpdate.state.hintTokens,
    }))
    if (passed && currentBlock) {
      markMicroCorrect(currentMicroQuestion?.id ?? 0, currentBlock.anchor)
    }
  }

  async function submitMicroAttempt(selected: string, bonusScore: number) {
    if (!sessionToken || !currentMicroQuestion) {
      return { correct: false, scoreDelta: 0, totalScore: hud.totalScore }
    }
    const res = await fetch('/api/quiz/answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionToken,
        questionId: currentMicroQuestion.id,
        selected,
        helpUsed: 'none',
        tipCount: 0,
        bonusScore,
      }),
    })
    const json = await res.json().catch(() => null)
    if (!res.ok) {
      return { correct: false, scoreDelta: 0, totalScore: hud.totalScore }
    }
    return {
      correct: !!json?.data?.correct,
      scoreDelta: Number(json?.data?.scoreDelta ?? 0),
      totalScore: Number(json?.data?.totalScore ?? hud.totalScore),
    }
  }

  async function handleFlowMcqAnswer(answerId: string) {
    if (!currentMicroQuestion || flowStatus !== 'idle') return
    setFlowSelected(answerId)
    const wouldBeCorrect = answerId === currentMicroQuestion.answer
    const bonusScore = wouldBeCorrect && (microStreak + 1) % 5 === 0 ? 10 : 0
    const result = await submitMicroAttempt(answerId, bonusScore)
    applyFlowResult(result.correct, result.scoreDelta, result.totalScore, bonusScore)
  }

  async function handleFlowCodeResult(runResult: {
    logs: { message: string }[]
    errors: string[]
    resultText: string
  }) {
    if (!currentMicroQuestion || currentMicroQuestion.type !== 'code' || flowStatus !== 'idle') return
    const logText = runResult.logs.map((entry) => entry.message).join('\n')
    const hasErrors = runResult.errors.length > 0
    const expected = currentMicroQuestion.expectedJson ?? {
      mode: 'consoleIncludes',
      value: currentMicroQuestion.answer,
    }
    const expectedValue = (expected.value ?? '').trim()
    const passed =
      expected.mode === 'noConsoleErrors'
        ? !hasErrors
        : !hasErrors &&
          (expected.mode === 'consoleIncludes'
            ? logText.includes(expectedValue)
            : runResult.resultText.trim() === expectedValue)
    const bonusScore = passed && (microStreak + 1) % 5 === 0 ? 10 : 0
    const result = await submitMicroAttempt(passed ? currentMicroQuestion.answer : '__incorrect__', bonusScore)
    applyFlowResult(result.correct, result.scoreDelta, result.totalScore, bonusScore)
  }

  function handleFlowContinue() {
    if (currentStep?.type === 'objectives') {
      if (flowIndex >= flowSteps.length - 1) return
      setFlowIndex((prev) => Math.min(flowSteps.length - 1, prev + 1))
      scrollToFlowTop()
      return
    }
    if (!currentBlock) return
    if (currentMicroQuestion && flowStatus !== 'correct') return
    if (!currentMicroQuestion) {
      setCompletedAnchors((prev) => {
        if (prev.has(currentBlock.anchor)) return prev
        const next = new Set(prev)
        next.add(currentBlock.anchor)
        return next
      })
    }
    if (flowIndex >= flowSteps.length - 1) return
    setFlowIndex((prev) => Math.min(flowSteps.length - 1, prev + 1))
    scrollToFlowTop()
  }

  function handleFlowBack() {
    if (flowIndex === 0) return
    setFlowIndex((prev) => Math.max(0, prev - 1))
    scrollToFlowTop()
  }

  function goToQuizStep() {
    setMobileTab('lesson')
    if (viewMode === 'coverage' && quizStepIndex > -1) {
      setFlowIndex(quizStepIndex)
      scrollToFlowTop()
      return
    }
    scrollToId('quiz')
  }

  async function handleQuizComplete(nextSummary: {
    correctCount: number
    answered: number
    totalScore: number
    tipUsed: number
    docUsed: number
    masteryHalfSteps: number
  }) {
    setSummary(nextSummary)
    if (sessionToken && topic.slug === 'prologue-final-quiz') {
      await fetch('/api/prologue/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          sessionToken,
          topicSlug: topic.slug,
          correctCount: nextSummary.correctCount,
          answered: nextSummary.answered,
          masteryHalfSteps: Math.min(10, nextSummary.masteryHalfSteps + microProgressHalfSteps),
        }),
      })
    }
    if (!sessionToken) return
    const res = await fetch(`/api/topic/weak-spots?topicSlug=${topic.slug}&sessionToken=${sessionToken}`)
    const json = await res.json()
    if (res.ok) {
      setWeakSpots(json?.data ?? [])
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col gap-0 px-0 pb-0 pt-0 text-[17px] leading-relaxed text-[color:var(--text)]">
      <div className="w-full glass-strong px-4 py-2 text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
        <div className="grid items-center gap-3 sm:grid-cols-[auto_1fr_auto]">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-expanded={sidebarOpen}
            className={cn(
              'inline-flex items-center gap-2 border border-[color:var(--border)] px-3 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.3em] transition',
              sidebarOpen
                ? 'bg-[color:var(--accent2)] text-slate-900'
                : 'bg-[color:var(--panel)] text-[color:var(--muted)]'
            )}
          >
            <span aria-hidden>☰</span>
            {flowLabel}
          </button>
          <div className="flex justify-center">
            <Image
              src="/brand/javascriptopia_logo_cropped.png"
              alt="Javascriptopia"
              width={180}
              height={72}
              priority
              className="h-8 w-auto drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen((prev) => !prev)}
              className={cn(
                'border border-[color:var(--border)] px-3 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.3em] transition',
                editorOpen
                  ? 'bg-[color:var(--accent2)] text-slate-900'
                  : 'bg-[color:var(--panel)] text-[color:var(--muted)]'
              )}
            >
              Code
            </button>
            <UserMenu />
          </div>
        </div>
      </div>

      <div
        className={cn(
          'grid gap-0',
          sidebarOpen ? 'lg:grid-cols-[18rem_minmax(0,1fr)]' : 'lg:grid-cols-[minmax(0,1fr)]'
        )}
      >
        {sidebarOpen ? (
          <StickyTopicControls
            progressText={progressText}
            sections={sectionsForMenu}
            showMenu={showMenu}
            onToggleMenu={() => setShowMenu((prev) => !prev)}
            onSelectSection={handleSectionSelect}
              side="left"
              showProgress
              showViewModeToggle={showModeToggle}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              fixed={false}
              showBackToJourney
              activeAnchorOverride={
              viewMode === 'coverage'
                ? currentStep?.type === 'objectives'
                  ? '__objectives'
                  : currentStep?.type === 'quiz'
                    ? 'quiz'
                  : currentBlock?.anchor ?? null
                : null
            }
            completedAnchors={completedAnchors}
            hud={hudDisplay}
            headerTitle={{
              bookTitle: book.title,
              chapterTitle: chapter.title,
              topicTitle: topic.title,
              storyIntro: topic.storyIntro ?? undefined,
            }}
          />
        ) : null}
        <div className="flex flex-col gap-0">
      <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="rounded-full border border-sky-200 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-sky-700 shadow-[0_12px_24px_rgba(59,130,246,0.2)]"
        >
          {mobileMenuOpen ? 'Close' : 'Menu'}
        </button>
        <button
          type="button"
          onClick={goToQuizStep}
          className="rounded-full border border-amber-300 bg-amber-200/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-900 shadow-[0_12px_24px_rgba(59,130,246,0.2)]"
        >
          Lesson Quiz
        </button>
      </div>
      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
          />
          <div className="absolute right-4 top-24 w-[260px] rounded-3xl border border-sky-200/70 bg-white/95 p-4 text-sm text-slate-700 shadow-[0_18px_40px_rgba(59,130,246,0.2)]">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Sections</p>
            <div className="mt-3 max-h-[60vh] space-y-2 overflow-auto pr-1">
              {sectionsForMenu.length > 0 ? (
                sectionsForMenu.map((block) => (
                  <button
                    key={block.anchor}
                    type="button"
                    onClick={() => {
                      handleSectionSelect(block.anchor)
                      setMobileMenuOpen(false)
                    }}
                    className="flex w-full items-center justify-between rounded-xl border border-transparent px-3 py-2 text-left text-sm text-slate-700 transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <span>{block.title ?? block.anchor}</span>
                    {completedAnchors.has(block.anchor) ? (
                      <span className="rounded-full bg-emerald-200/70 px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-emerald-700">
                        ✓
                      </span>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="text-xs text-slate-500">No sections yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <header className="space-y-0">
        {viewMode !== 'coverage' && doc?.objectives?.length ? (
          <div className="glass rounded-2xl p-5 text-base text-[color:var(--text)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Objectives</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-[color:var(--text)]">
              {doc.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {isCoverageMode ? (
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileTab('lesson')}
              className={cn(
                'rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition',
                mobileTab === 'lesson'
                  ? 'border-[color:var(--accent)] bg-[color:var(--accent)] text-slate-900'
                  : 'border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--text)]'
              )}
            >
              Lesson
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('code')}
              className={cn(
                'rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] transition',
                mobileTab === 'code'
                  ? 'border-[color:var(--accent2)] bg-[color:var(--accent2)] text-slate-900'
                  : 'border-[color:var(--border)] bg-[color:var(--panel)] text-[color:var(--text)]'
              )}
            >
              Code
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 lg:hidden">
          <div className="rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-700">
            {progressText}
          </div>
        </div>
      </header>

      <div
        className={cn(
          isCoverageMode ? 'grid gap-0' : 'block',
          isCoverageMode && editorOpen ? 'lg:grid-cols-2 lg:items-start' : 'lg:grid-cols-1'
        )}
      >
        <div
          className={cn(
            isCoverageMode ? (mobileTab === 'lesson' ? 'block' : 'hidden') : 'block',
            'lg:block'
          )}
        >
          <section id="scrollbook" ref={docRef} className="scroll-mt-24 space-y-0">
        <DocAnchorHighlighter />
        {viewMode === 'coverage' ? (
          <div className="space-y-0">
            {currentStep?.type === 'objectives' ? (
              <div className="glass-strong rounded-3xl p-6 text-base text-[color:var(--text)] md:p-7">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Objectives</p>
                {doc?.objectives?.length ? (
                  <ul className="mt-4 list-disc space-y-2 pl-5 text-[color:var(--text)]">
                    {doc.objectives.map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-sm text-[color:var(--muted)]">No objectives listed yet.</p>
                )}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleFlowContinue}
                    className="rounded-full btn-primary px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
                  >
                    Continue
                  </button>
                </div>
              </div>
            ) : currentStep?.type === 'quiz' ? (
              <div className="glass-strong rounded-3xl p-6 text-base text-[color:var(--text)] md:p-7">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Lesson Quiz</p>
                <h2 className="mt-3 text-2xl font-semibold text-[color:var(--text)]">Ready for the quiz?</h2>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  Answer the questions below to complete this lesson.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={goToQuizStep}
                    className="rounded-full border border-amber-300 bg-amber-200/80 px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber-900"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            ) : (
              <>
                {doc ? (
                  <article className="glass-strong p-0 text-base text-[color:var(--text)]">
                    <div ref={docContentRef} className="space-y-0">
                      {docContent}
                    </div>
                  </article>
                ) : (
                  <div className="glass rounded-2xl p-6 text-sm text-[color:var(--muted)]">
                    No doc page is linked to this lesson yet.
                  </div>
                )}

                <div className="glass-strong rounded-3xl p-6 md:p-7">
              <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Micro challenge</p>
              {!currentMicroQuestion ? (
                <div className="mt-3 text-sm text-[color:var(--muted)]">
                  No challenge for this step. Tap continue to move on.
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <h3 className="text-lg font-semibold text-[color:var(--text)]">{currentMicroQuestion.prompt}</h3>
                  {currentMicroQuestion.type === 'mcq' && currentMicroQuestion.choicesJson ? (
                    <div className="grid gap-3">
                      {currentMicroQuestion.choicesJson.map((choice) => (
                        <button
                          key={choice.id}
                          type="button"
                          onClick={() => handleFlowMcqAnswer(choice.id)}
                          className={cn(
                            'rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-[color:var(--text)] transition hover:border-[color:var(--accent)]/60',
                            flowSelected === choice.id && 'border-[color:var(--accent)]/80 bg-[color:var(--panel-strong)]'
                          )}
                        >
                          {choice.text}
                        </button>
                      ))}
                    </div>
                  ) : currentMicroQuestion.type === 'code' ? (
                    <div className="space-y-3">
                      <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                        Code challenge
                      </div>
                      <p className="text-sm text-[color:var(--muted)]">
                        Open the Code panel, run the solution, and we’ll validate the output here.
                      </p>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditorOpen(true)
                            setMobileTab('code')
                          }}
                          className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text)]"
                        >
                          Open Code Challenge
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {flowStatus !== 'idle' ? (
                    <div
                      className={cn(
                        'rounded-2xl border px-4 py-3 text-sm',
                        flowStatus === 'correct'
                          ? 'border-emerald-300 bg-emerald-50/10 text-emerald-200'
                          : 'border-rose-300/60 bg-rose-500/10 text-rose-100'
                      )}
                    >
                      <p className="font-semibold">
                        {flowStatus === 'correct' ? '✅ Great job!' : '❌ Not quite yet.'}
                      </p>
                      {flowStatus === 'correct' && flowXpDelta ? (
                        <p className="mt-2 text-emerald-200">+{flowXpDelta} XP</p>
                      ) : null}
                      {flowStatus === 'incorrect' ? (
                        <div className="mt-3 space-y-2 text-[color:var(--text)]">
                          {currentMicroQuestion.tip1 ? <p>{currentMicroQuestion.tip1}</p> : null}
                          {flowShowTip2 && currentMicroQuestion.tip2 ? <p>{currentMicroQuestion.tip2}</p> : null}
                          {!flowShowTip2 && currentMicroQuestion.tip2 ? (
                            <button
                              type="button"
                              onClick={() => setFlowShowTip2(true)}
                              className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel-strong)] px-4 py-1 text-xs uppercase tracking-[0.3em] text-[color:var(--text)]"
                            >
                              Need another hint?
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        {flowStatus === 'incorrect' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setFlowStatus('idle')
                                setFlowSelected(null)
                                setFlowShowTip2(false)
                              }}
                              className="rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text)]"
                            >
                              Try again
                            </button>
                            <button
                              type="button"
                              onClick={() => flowCardRef.current?.scrollIntoView({ behavior: 'smooth' })}
                              className="rounded-full border border-[color:var(--border)] bg-[color:var(--panel)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text)]"
                            >
                              Review this topic
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={handleFlowBack}
                      disabled={flowIndex === 0}
                  className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text)] disabled:opacity-40"
                >
                  Back
                </button>
                <div className="flex flex-wrap items-center gap-3">
                  {currentMicroQuestion?.type === 'code' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditorOpen(true)
                        setMobileTab('code')
                        playgroundRef.current?.reset()
                      }}
                      className="rounded-full border border-white/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--text)]"
                    >
                      Reset Card
                    </button>
                  ) : null}
                  {currentMicroQuestion?.type === 'code' ? (
                    <span className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
                      Run the code to check
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => (isLastContentStep ? goToQuizStep() : handleFlowContinue())}
                    disabled={!!currentMicroQuestion && flowStatus !== 'correct'}
                    className={cn(
                      'rounded-full px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] disabled:opacity-40',
                      isLastContentStep
                        ? 'border border-amber-300 bg-amber-200/80 text-amber-900'
                        : 'border border-[color:var(--border)] bg-[color:var(--panel-strong)] text-[color:var(--text)]'
                    )}
                  >
                    {isLastContentStep ? 'Start Quiz' : 'Continue'}
                  </button>
                </div>
              </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        <div className={cn(viewMode === 'scroll' ? 'block space-y-6' : 'hidden')}>
          <div className="sticky top-20 z-20 glass rounded-2xl px-4 py-3 text-sm text-[color:var(--text)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Scrollbook</p>
            <p className="mt-1 text-lg font-semibold text-[color:var(--text)]">{topic.title}</p>
          </div>
          {doc ? (
            <article className="glass-strong space-y-7 rounded-3xl p-6 text-base text-[color:var(--text)] md:p-7">
              <div className="space-y-7">
                {docContentWithMicro}
              </div>
            </article>
          ) : (
            <div className="glass rounded-2xl p-6 text-sm text-[color:var(--muted)]">
              No doc page is linked to this lesson yet.
            </div>
          )}
        </div>

      </section>

      {quizCount > 0 && showQuizSection ? (
        <QuizSection
          topicSlug={topic.slug}
          topicTitle={topic.title}
          sessionToken={sessionToken}
          mode={mode}
          quizCount={quizCount}
          headStartPips={headStartPips}
          onProgress={setQuizAnswered}
          onHudUpdate={(data) =>
            setHud((prev) => ({
              ...prev,
              ...data,
              streak: data.quizStreak ?? data.streak,
              quizStreak: data.quizStreak ?? data.streak,
              microStreak: prev.microStreak,
              shieldCount: prev.shieldCount,
              hintTokens: prev.hintTokens,
            }))
          }
          onComplete={handleQuizComplete}
          onTeleportAnchor={(anchor) => {
            if (viewMode === 'coverage') {
              const nextIndex = anchorToIndex.get(anchor)
              if (nextIndex !== undefined) {
                setFlowIndex(nextIndex)
                setFlowStatus('idle')
                setFlowSelected(null)
                setFlowShowTip2(false)
                setFlowXpDelta(null)
              }
              scrollToFlowTop()
              return
            }
            scrollToAnchor(anchor)
          }}
        />
      ) : null}

      {summary ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 text-base text-slate-800 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Completion Summary</p>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Score</p>
              <p className="mt-1 text-xl font-semibold">{summary.totalScore}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Correct</p>
              <p className="mt-1 text-xl font-semibold">
                {summary.correctCount}/{summary.answered}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Help used</p>
              <p className="mt-1 text-xl font-semibold">
                Tip {summary.tipUsed} • Doc {summary.docUsed}
              </p>
            </div>
          </div>
          <div className="mt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">Weak spots</p>
            {weakSpots.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {weakSpots.slice(0, 4).map((spot) => (
                  <li key={spot.anchor} className="rounded-xl border border-emerald-200 bg-white/80 px-4 py-2">
                    <span className="font-semibold">{spot.title}</span>
                    <span className="ml-2 text-xs uppercase tracking-[0.2em] text-emerald-600/80">
                      Missed {spot.wrongCount}x
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-600">No weak spots tracked yet.</p>
            )}
          </div>
          {nav.nextTopicSlug ? (
            <Link
              href={`/topic/${nav.nextTopicSlug}`}
              className="mt-6 inline-flex rounded-full border border-emerald-300 bg-emerald-200/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-900"
            >
              Next Lesson
            </Link>
          ) : null}
        </section>
      ) : null}
        </div>
        {isCoverageMode ? (
          <aside
            className={cn(
              mobileTab === 'code' ? 'block' : 'hidden',
              editorOpen ? 'lg:block' : 'lg:hidden',
              'space-y-4'
            )}
          >
            {editorOpen ? (
              <Playground
                ref={playgroundRef}
                title={undefined}
                files={editorFiles}
                key={editorStepKey}
                showPreview={undefined}
                height={420}
                previewHeight={220}
                onRunComplete={currentMicroQuestion?.type === 'code' ? handleFlowCodeResult : undefined}
                onFilesChange={(files) =>
                  setEditorFilesByStep((prev) => ({
                    ...prev,
                    [editorStepKey]: files,
                  }))
                }
              />
            ) : null}
          </aside>
        ) : null}
      </div>
      </div>
    </div>

      <RankUpModal
        open={showRankModal}
        previousRank={rankModalData?.previous ?? ''}
        newRank={rankModalData?.current ?? ''}
        rankSlug={rankModalData?.slug}
        description={rankModalData?.description}
        onClose={() => setShowRankModal(false)}
      />
    </div>
  )
}
