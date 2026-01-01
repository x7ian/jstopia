import { prisma } from '@/lib/db'
import { BOOK1_RANKS, BOOK1_SLUG } from '@/lib/ranks/book1'
import { computeRank } from '@/lib/ranks/computeRank'
import { getRankBySlug } from '@/lib/ranks/utils'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionToken = searchParams.get('sessionToken')?.trim()
  const bookSlug = searchParams.get('bookSlug')?.trim() ?? BOOK1_SLUG

  if (!sessionToken) {
    return Response.json({ ok: false, error: 'sessionToken is required' }, { status: 400 })
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

  const totalXp = session?.totalScore ?? 0

  const completedTopics = await prisma.topicProgress.findMany({
    where: { sessionToken, status: 'completed' },
    include: { topic: { select: { slug: true, chapter: { select: { slug: true } } } } },
  })

  const completedTopicSlugs = new Set(completedTopics.map((entry) => entry.topic.slug))
  const availableTopicSlugs = new Set(
    book.chapters.flatMap((chapter) => chapter.topics.map((topic) => topic.slug))
  )
  const chapterTotals = new Map(book.chapters.map((chapter) => [chapter.slug, chapter.topics.length]))
  const chapterCompletedCounts = new Map<string, number>()

  completedTopics.forEach((entry) => {
    const chapterSlug = entry.topic.chapter.slug
    chapterCompletedCounts.set(chapterSlug, (chapterCompletedCounts.get(chapterSlug) ?? 0) + 1)
  })

  const computed = computeRank({
    completedTopicSlugs,
    availableTopicSlugs,
    chapterTopicCounts: new Map(
      book.chapters.map((chapter) => [
        chapter.slug,
        { total: chapter.topics.length, completed: chapterCompletedCounts.get(chapter.slug) ?? 0 },
      ])
    ),
  })

  const currentRank =
    computed.rankSlug === 'unranked'
      ? null
      : getRankBySlug(computed.rankSlug)

  const nextRank = computed.nextRankSlug
    ? BOOK1_RANKS.find((rank) => rank.slug === computed.nextRankSlug) ?? null
    : null

  if (currentRank && currentRank.slug !== session?.rank) {
    await prisma.session.update({
      where: { sessionToken },
      data: { rank: currentRank.slug, rankUpdatedAt: new Date(), currentBookSlug: book.slug },
    })
  }

  let nextRankPayload: null | {
    slug: string
    title: string
    description: string
    level?: number
    gemPath?: string
    accent?: string
    xpMin: number
    xpProgressPct: number
    comingSoon?: boolean
  } = null

  if (nextRank) {
    nextRankPayload = {
      slug: nextRank.slug,
      title: nextRank.title,
      description: nextRank.description,
      level: nextRank.level,
      gemPath: nextRank.gemPath,
      accent: nextRank.accent,
      xpMin: nextRank.xpMin,
      xpProgressPct: nextRank.xpMin > 0 ? Math.min(1, totalXp / nextRank.xpMin) : 1,
      comingSoon: computed.comingSoon ?? false,
    }
  }

  return Response.json({
    ok: true,
    data: {
      rankSlug: currentRank?.slug ?? 'unranked',
      nextRankSlug: nextRank?.slug ?? null,
      currentRank: currentRank
        ? {
            slug: currentRank.slug,
            level: currentRank.level,
            title: currentRank.title,
            description: currentRank.description,
            gemPath: currentRank.gemPath,
            accent: currentRank.accent,
          }
        : null,
      totalXp,
      nextRank: nextRankPayload,
    },
  })
}
