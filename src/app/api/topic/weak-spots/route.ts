import { prisma } from '@/lib/db'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const topicSlug = searchParams.get('topicSlug')?.trim()
  const sessionToken = searchParams.get('sessionToken')?.trim()

  if (!topicSlug || !sessionToken) {
    return Response.json({ ok: false, error: 'topicSlug and sessionToken are required' }, { status: 400 })
  }

  const topic = await prisma.topic.findUnique({ where: { slug: topicSlug } })
  if (!topic) {
    return Response.json({ ok: false, error: 'Topic not found' }, { status: 404 })
  }

  const attempts = await prisma.attempt.findMany({
    where: { sessionToken, question: { topicId: topic.id }, correct: false },
    include: { question: { include: { answerDocBlock: true } } },
  })

  const counts = new Map<number, { anchor: string; title: string; wrongCount: number }>()

  for (const attempt of attempts) {
    const block = attempt.question.answerDocBlock
    if (!block) continue
    const existing = counts.get(block.id)
    if (existing) {
      existing.wrongCount += 1
    } else {
      counts.set(block.id, {
        anchor: block.anchor,
        title: block.title ?? block.anchor,
        wrongCount: 1,
      })
    }
  }

  const data = Array.from(counts.values()).sort((a, b) => b.wrongCount - a.wrongCount)

  return Response.json({ ok: true, data })
}
