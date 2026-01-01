import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        sessionToken?: string
        topicSlug?: string
      }
    | null

  if (!body?.sessionToken || !body.topicSlug) {
    return Response.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
  }

  const topic = await prisma.topic.findUnique({ where: { slug: body.topicSlug } })
  if (!topic) {
    return Response.json({ ok: false, error: 'Lesson not found' }, { status: 404 })
  }

  let topicProgress = await prisma.topicProgress.findUnique({
    where: { sessionToken_topicId: { sessionToken: body.sessionToken, topicId: topic.id } },
  })

  if (!topicProgress) {
    topicProgress = await prisma.topicProgress.create({
      data: {
        sessionToken: body.sessionToken,
        topicId: topic.id,
        status: 'unlocked',
        score: 0,
      },
    })
  }

  let unlocked: { nextTopicSlug?: string; nextChapterSlug?: string; nextBookSlug?: string } = {}

  if (topicProgress.status !== 'completed') {
    await prisma.topicProgress.update({
      where: { sessionToken_topicId: { sessionToken: body.sessionToken, topicId: topic.id } },
      data: { status: 'completed', completedAt: new Date() },
    })
    unlocked = await unlockNext(body.sessionToken, topic.id)
  }

  return Response.json({
    ok: true,
    data: { unlocked },
  })
}

async function unlockNext(sessionToken: string, topicId: number) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      chapter: {
        include: {
          topics: { orderBy: { order: 'asc' } },
          book: { include: { chapters: { orderBy: { order: 'asc' }, include: { topics: { orderBy: { order: 'asc' } } } } } },
        },
      },
    },
  })

  if (!topic) return {}

  const chapterTopics = topic.chapter.topics
  const currentIndex = chapterTopics.findIndex((item) => item.id === topic.id)
  const nextTopic = chapterTopics[currentIndex + 1]

  if (nextTopic) {
    await unlockTopic(sessionToken, nextTopic.id)
    return { nextTopicSlug: nextTopic.slug }
  }

  const chapters = topic.chapter.book.chapters
  const chapterIndex = chapters.findIndex((chapter) => chapter.id === topic.chapter.id)
  const nextChapter = chapters[chapterIndex + 1]

  if (nextChapter && nextChapter.topics.length > 0) {
    const firstTopic = nextChapter.topics[0]
    await unlockTopic(sessionToken, firstTopic.id)
    return { nextChapterSlug: nextChapter.slug, nextTopicSlug: firstTopic.slug }
  }

  return {}
}

async function unlockTopic(sessionToken: string, topicId: number) {
  const existing = await prisma.topicProgress.findUnique({
    where: { sessionToken_topicId: { sessionToken, topicId } },
  })

  if (!existing) {
    await prisma.topicProgress.create({
      data: { sessionToken, topicId, status: 'unlocked' },
    })
    return
  }

  if (existing.status === 'locked') {
    await prisma.topicProgress.update({
      where: { sessionToken_topicId: { sessionToken, topicId } },
      data: { status: 'unlocked' },
    })
  }
}
