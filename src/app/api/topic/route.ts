import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const topicSlug = searchParams.get('topicSlug')?.trim()
  const sessionToken = searchParams.get('sessionToken')?.trim()

  if (!topicSlug || !sessionToken) {
    return Response.json({ ok: false, error: 'topicSlug and sessionToken are required' }, { status: 400 })
  }

  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
    include: {
      chapter: { include: { book: true, topics: { orderBy: { order: 'asc' } } } },
      docPage: { include: { blocks: { orderBy: { order: 'asc' } } } },
    },
  })

  if (!topic) {
    return Response.json({ ok: false, error: 'Topic not found' }, { status: 404 })
  }

  const progress = await prisma.topicProgress.findUnique({
    where: { sessionToken_topicId: { sessionToken, topicId: topic.id } },
  })

  const topics = topic.chapter.topics
  const currentIndex = topics.findIndex((item) => item.id === topic.id)
  const prevTopic = currentIndex > 0 ? topics[currentIndex - 1] : null
  const nextTopic = currentIndex >= 0 && currentIndex < topics.length - 1 ? topics[currentIndex + 1] : null

  return Response.json({
    ok: true,
    data: {
      topic: { id: topic.id, slug: topic.slug, title: topic.title, storyIntro: topic.storyIntro },
      chapter: { id: topic.chapter.id, slug: topic.chapter.slug, title: topic.chapter.title },
      book: { id: topic.chapter.book.id, slug: topic.chapter.book.slug, title: topic.chapter.book.title, themeJson: topic.chapter.book.themeJson },
      doc: topic.docPage
        ? {
            page: {
              slug: topic.docPage.slug,
              title: topic.docPage.title,
              mdxPath: topic.docPage.mdxPath,
              objectives: topic.docPage.objectives,
              estimatedMinutes: topic.docPage.estimatedMinutes,
            },
            blocks: topic.docPage.blocks.map((block) => ({
              id: block.id,
              anchor: block.anchor,
              title: block.title,
              kind: block.kind,
              order: block.order,
            })),
          }
        : null,
      progress: {
        topicStatus: progress?.status ?? (topic.lockedByDefault ? 'locked' : 'unlocked'),
        score: progress?.score ?? 0,
      },
      nav: {
        prevTopicSlug: prevTopic?.slug ?? null,
        nextTopicSlug: nextTopic?.slug ?? null,
      },
    },
  })
}
