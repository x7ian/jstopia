import { prisma } from '@/lib/db'
import { BOOK1_SLUG } from '@/lib/ranks/book1'
import { getRankBySlug, getRankIndex } from '@/lib/ranks/utils'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        sessionToken?: string
        bookSlug?: string
        rankSlug?: string
        passed?: boolean
        score?: number
        masteryHalfSteps?: number
        correctCount?: number
        questionCount?: number
        helpUsedSummary?: { none?: number; tip?: number; doc?: number }
      }
    | null

  const rankSlug = body?.rankSlug?.trim()
  const sessionToken = body?.sessionToken?.trim()
  const bookSlug = body?.bookSlug?.trim() ?? BOOK1_SLUG

  if (!sessionToken || !rankSlug) {
    return Response.json({ ok: false, error: 'sessionToken and rankSlug are required' }, { status: 400 })
  }

  const rank = getRankBySlug(rankSlug)
  if (!rank || rank.slug !== rankSlug || !rank.bossExam) {
    return Response.json({ ok: false, error: 'Boss exam not found' }, { status: 404 })
  }

  const [session, book] = await Promise.all([
    prisma.session.upsert({ where: { sessionToken }, update: {}, create: { sessionToken } }),
    prisma.book.findUnique({
      where: { slug: bookSlug },
      include: { chapters: { include: { topics: true } } },
    }),
  ])

  if (!book) {
    return Response.json({ ok: false, error: 'Book not found' }, { status: 404 })
  }

  const completedTopics = await prisma.topicProgress.findMany({
    where: { sessionToken, status: 'completed' },
    include: { topic: { select: { slug: true, chapter: { select: { slug: true } } } } },
  })

  const completedTopicSlugs = new Set(completedTopics.map((entry) => entry.topic.slug))
  const chapterTotals = new Map(book.chapters.map((chapter) => [chapter.slug, chapter.topics.length]))
  const chapterCompletedCounts = new Map<string, number>()

  completedTopics.forEach((entry) => {
    const chapterSlug = entry.topic.chapter.slug
    chapterCompletedCounts.set(chapterSlug, (chapterCompletedCounts.get(chapterSlug) ?? 0) + 1)
  })

  const progressReq = rank.progressReq
  const requirementsMet = (() => {
    if (rank.lockedByContent) return false
    if (progressReq?.requiredTopicSlugs?.length) {
      for (const slug of progressReq.requiredTopicSlugs) {
        if (!completedTopicSlugs.has(slug)) return false
      }
    }
    if (progressReq?.requiredChapterSlugs?.length) {
      for (const slug of progressReq.requiredChapterSlugs) {
        const total = chapterTotals.get(slug) ?? 0
        const completed = chapterCompletedCounts.get(slug) ?? 0
        if (total === 0 || completed < total) return false
      }
    }
    if (progressReq?.requiredCompletedTopicsCountInChapter?.length) {
      for (const req of progressReq.requiredCompletedTopicsCountInChapter) {
        const completed = chapterCompletedCounts.get(req.chapterSlug) ?? 0
        if (completed < req.count) return false
      }
    }
    return true
  })()

  const totalXp = session?.totalScore ?? 0
  const xpOk = totalXp >= rank.xpMin
  const helpSummary = body?.helpUsedSummary ?? {}
  const tipCount = helpSummary.tip ?? 0
  const docCount = helpSummary.doc ?? 0
  const masteryHalfSteps = body?.masteryHalfSteps ?? 0
  const correctCount = body?.correctCount ?? body?.score ?? 0
  const questionCount = body?.questionCount ?? rank.bossExam.questionCount
  const scoreOk = correctCount >= Math.ceil(questionCount * 0.7)
  const helpOk = tipCount <= rank.bossExam.allowedTipCount && docCount <= rank.bossExam.allowedDocRevealCount
  const masteryOk = masteryHalfSteps >= rank.bossExam.masteryMinHalfSteps

  const passed = Boolean(body?.passed) && requirementsMet && xpOk && helpOk && masteryOk && scoreOk

  await prisma.bossExamAttempt.create({
    data: {
      sessionToken,
      bookSlug,
      rankSlug,
      passed,
      score: correctCount,
      mastery: masteryHalfSteps,
      helpUsedJson: helpSummary,
    },
  })

  const currentRankSlug = session?.rank ?? 'initiate'
  const currentIndex = getRankIndex(currentRankSlug)
  const nextIndex = getRankIndex(rankSlug)
  const shouldPromote = passed && nextIndex > currentIndex

  if (shouldPromote) {
    await prisma.session.update({
      where: { sessionToken },
      data: {
        rank: rankSlug,
        rankUpdatedAt: new Date(),
        currentBookSlug: bookSlug,
      },
    })
  }

  return Response.json({
    ok: true,
    data: {
      rankUp: shouldPromote,
      previousRank: currentRankSlug,
      newRank: shouldPromote ? rankSlug : currentRankSlug,
      newRankTitle: shouldPromote ? rank.title : null,
      awardedBadge: shouldPromote ? rank.title : null,
    },
  })
}
