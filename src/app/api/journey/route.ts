import { prisma } from '@/lib/db'
import { deriveStatusFromTopics } from '@/lib/unlock'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionToken = searchParams.get('sessionToken')?.trim()

  if (!sessionToken) {
    return Response.json({ ok: false, error: 'sessionToken is required' }, { status: 400 })
  }

  const [books, progress] = await Promise.all([
    prisma.book.findMany({
      orderBy: { order: 'asc' },
      include: {
        chapters: {
          orderBy: { order: 'asc' },
          include: { topics: { orderBy: { order: 'asc' } } },
        },
      },
    }),
    prisma.topicProgress.findMany({ where: { sessionToken } }),
  ])

  const progressMap = new Map(progress.map((entry) => [entry.topicId, entry]))

  const data = books.map((book) => {
    const chapters = book.chapters.map((chapter) => {
      const topics = chapter.topics.map((topic) => {
        const entry = progressMap.get(topic.id)
        const status = entry?.status ?? (topic.lockedByDefault ? 'locked' : 'unlocked')
        return {
          id: topic.id,
          slug: topic.slug,
          title: topic.title,
          order: topic.order,
          storyIntro: topic.storyIntro,
          state: status,
          progress: { status, score: entry?.score ?? 0 },
        }
      })

      const chapterState = deriveStatusFromTopics(topics.map((topic) => topic.state))

      return {
        id: chapter.id,
        slug: chapter.slug,
        title: chapter.title,
        order: chapter.order,
        storyIntro: chapter.storyIntro,
        theme: chapter.themeOverrideJson,
        state: chapterState,
        topics,
      }
    })

    const bookState = deriveStatusFromTopics(
      chapters.flatMap((chapter) => chapter.topics.map((topic) => topic.state))
    )

    return {
      id: book.id,
      slug: book.slug,
      title: book.title,
      order: book.order,
      storyIntro: book.storyIntro,
      theme: book.themeJson,
      state: bookState,
      chapters,
    }
  })

  return Response.json({ ok: true, data: { books: data } })
}
