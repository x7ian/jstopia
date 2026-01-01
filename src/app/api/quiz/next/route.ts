import { prisma } from '@/lib/db'

const RECENT_LIMIT = 5

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sessionToken = searchParams.get('sessionToken')?.trim()
  const topicSlug = searchParams.get('topicSlug')?.trim()
  const difficulty = searchParams.get('difficulty')?.trim() as 'basic' | 'medium' | 'advanced' | null
  const phase = (searchParams.get('phase')?.trim() as 'micro' | 'quiz' | 'boss' | null) ?? 'quiz'
  const rankSlug = searchParams.get('rankSlug')?.trim() ?? null

  if (!sessionToken) {
    return Response.json({ ok: false, error: 'sessionToken is required' }, { status: 400 })
  }
  if (phase === 'boss' && !rankSlug) {
    return Response.json({ ok: false, error: 'rankSlug is required for boss phase' }, { status: 400 })
  }

  let topic = null
  if (phase !== 'boss') {
    if (!topicSlug) {
      return Response.json({ ok: false, error: 'topicSlug is required' }, { status: 400 })
    }
    topic = await prisma.topic.findUnique({ where: { slug: topicSlug } })
    if (!topic) {
      return Response.json({ ok: false, error: 'Topic not found' }, { status: 404 })
    }
  }

  const recentAttempts = await prisma.attempt.findMany({
    where:
      phase === 'boss' && rankSlug
        ? { sessionToken, question: { phase: 'boss', rankSlug } }
        : { sessionToken, question: { topicId: topic?.id } },
    orderBy: { createdAt: 'desc' },
    take: RECENT_LIMIT,
    select: { questionId: true },
  })

  const excludeIds = recentAttempts.map((attempt) => attempt.questionId)

  const baseWhere =
    phase === 'boss' && rankSlug
      ? {
          phase: 'boss',
          rankSlug,
          ...(difficulty ? { difficulty } : {}),
          ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        }
      : {
          topicId: topic?.id ?? 0,
          ...(difficulty ? { difficulty } : {}),
          ...(phase ? { phase } : {}),
          ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        }

  let question = await prisma.question.findFirst({
    where: baseWhere,
    include: { docPage: true, answerDocBlock: true, topic: true },
    orderBy: { id: 'asc' },
  })

  if (!question && excludeIds.length > 0) {
    question = await prisma.question.findFirst({
      where:
        phase === 'boss' && rankSlug
          ? { phase: 'boss', rankSlug, ...(difficulty ? { difficulty } : {}) }
          : { topicId: topic?.id ?? 0, ...(difficulty ? { difficulty } : {}), ...(phase ? { phase } : {}) },
      include: { docPage: true, answerDocBlock: true, topic: true },
      orderBy: { id: 'asc' },
    })
  }

  if (!question) {
    return Response.json({ ok: false, error: 'No questions available' }, { status: 404 })
  }

  const resolvedDocPage = question.docPageId ? question.docPage : null
  const fallbackDocPage = !question.docPageId && question.topic?.docPageId
    ? await prisma.docPage.findUnique({ where: { id: question.topic.docPageId } })
    : null
  const docPage = resolvedDocPage ?? fallbackDocPage

  return Response.json({
    ok: true,
    data: {
      topic: topic ? { id: topic.id, slug: topic.slug, title: topic.title } : null,
      question: {
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        code: question.code,
        files: question.filesJson ?? null,
        expected: question.expectedJson ?? null,
        difficulty: question.difficulty,
        phase: question.phase,
        choices: question.choicesJson ?? null,
        tip1: question.tip1,
        tip2: question.tip2,
        explanationShort: question.explanationShort,
        doc: docPage
          ? {
              pageSlug: docPage.slug,
              answerBlock: question.answerDocBlock
                ? {
                    id: question.answerDocBlock.id,
                    anchor: question.answerDocBlock.anchor,
                    title: question.answerDocBlock.title,
                    kind: question.answerDocBlock.kind,
                  }
                : null,
            }
          : null,
      },
    },
  })
}
