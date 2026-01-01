import { prisma } from '@/lib/db'
import { scoreAnswer } from '@/lib/scoring'

const REQUIRED_CORRECT = 6

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | {
        sessionToken: string
        questionId: number
        selected: string
        elapsedMs?: number
        helpUsed?: 'none' | 'tip' | 'doc'
        tipCount?: number
      }
    | null

  if (!body?.sessionToken || !body.questionId || !body.selected) {
    return Response.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
  }

  const question = await prisma.question.findUnique({
    where: { id: body.questionId },
    include: {
      topic: { include: { chapter: { include: { book: true } } } },
      docPage: true,
      answerDocBlock: true,
    },
  })

  if (!question) {
    return Response.json({ ok: false, error: 'Question not found' }, { status: 404 })
  }

  const normalizedSelected = body.selected.trim()
  const normalizedAnswer = question.answer.trim()
  const correct = normalizedSelected === normalizedAnswer

  const helpUsed = body.helpUsed ?? 'none'
  const scoreDelta = correct ? scoreAnswer(question.difficulty, helpUsed) : 0
  const isPrologueTrial = question.topic.slug === 'prologue-final-quiz'

  await prisma.attempt.create({
    data: {
      sessionToken: body.sessionToken,
      questionId: question.id,
      correct,
      selected: normalizedSelected,
      elapsedMs: body.elapsedMs ?? 0,
      helpUsed,
      tipCount: body.tipCount ?? 0,
      scoreAwarded: scoreDelta,
    },
  })

  const session = await prisma.session.upsert({
    where: { sessionToken: body.sessionToken },
    update: { totalScore: { increment: scoreDelta } },
    create: { sessionToken: body.sessionToken, totalScore: scoreDelta },
  })

  let topicProgress = await prisma.topicProgress.findUnique({
    where: { sessionToken_topicId: { sessionToken: body.sessionToken, topicId: question.topicId } },
  })

  let topicCompleted = false
  let unlocked: { nextTopicSlug?: string; nextChapterSlug?: string; nextBookSlug?: string } = {}

  if (question.phase !== 'boss') {
    if (!topicProgress) {
      topicProgress = await prisma.topicProgress.create({
        data: {
          sessionToken: body.sessionToken,
          topicId: question.topicId,
          status: 'unlocked',
          score: 0,
        },
      })
    }

    if (correct && topicProgress.status !== 'completed') {
      const nextScore = topicProgress.score + 1
      if (isPrologueTrial) {
        topicProgress = await prisma.topicProgress.update({
          where: { sessionToken_topicId: { sessionToken: body.sessionToken, topicId: question.topicId } },
          data: { score: nextScore },
        })
      } else {
        const quizCount = await prisma.question.count({ where: { topicId: question.topicId, phase: 'quiz' } })
        const requiredCorrect = Math.min(REQUIRED_CORRECT, quizCount || REQUIRED_CORRECT)
        const shouldComplete = nextScore >= requiredCorrect

        topicProgress = await prisma.topicProgress.update({
          where: { sessionToken_topicId: { sessionToken: body.sessionToken, topicId: question.topicId } },
          data: {
            score: nextScore,
            status: shouldComplete ? 'completed' : 'unlocked',
            completedAt: shouldComplete ? new Date() : null,
          },
        })

        if (shouldComplete) {
          topicCompleted = true
          unlocked = await unlockNext(body.sessionToken, question.topicId)
        }
      }
    }
  }

  return Response.json({
    ok: true,
    data: {
      correct,
      scoreDelta,
      totalScore: session.totalScore,
      topicScore: topicProgress?.score ?? 0,
      explanation: question.explanationShort,
      phase: question.phase,
      topicCompleted,
      unlocked,
      teleport: question.answerDocBlock
        ? {
            docPageSlug: question.docPage?.slug ?? null,
            anchor: question.answerDocBlock.anchor,
          }
        : null,
    },
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

  const nextBook = await prisma.book.findFirst({
    where: { order: { gt: topic.chapter.book.order } },
    orderBy: { order: 'asc' },
    include: { chapters: { orderBy: { order: 'asc' }, include: { topics: { orderBy: { order: 'asc' } } } } },
  })

  if (nextBook?.chapters?.[0]?.topics?.[0]) {
    const firstChapter = nextBook.chapters[0]
    const firstTopic = firstChapter.topics[0]
    await unlockTopic(sessionToken, firstTopic.id)
    return { nextBookSlug: nextBook.slug, nextChapterSlug: firstChapter.slug, nextTopicSlug: firstTopic.slug }
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
