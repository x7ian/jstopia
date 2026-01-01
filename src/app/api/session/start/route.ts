import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { sessionToken?: string } | null
  const incomingToken = body?.sessionToken?.trim()

  const existing = incomingToken
    ? await prisma.session.findUnique({ where: { sessionToken: incomingToken } })
    : null

  const sessionToken = existing?.sessionToken ?? incomingToken ?? crypto.randomUUID()

  if (!existing) {
    await prisma.session.create({ data: { sessionToken } })
  }

  const progressCount = await prisma.topicProgress.count({ where: { sessionToken } })
  if (progressCount === 0) {
    const topics = await prisma.topic.findMany({ select: { id: true, lockedByDefault: true } })
    if (topics.length > 0) {
      await prisma.topicProgress.createMany({
        data: topics.map((topic) => ({
          sessionToken,
          topicId: topic.id,
          status: topic.lockedByDefault ? 'locked' : 'unlocked',
        })),
      })
    }
  }

  return Response.json({ ok: true, data: { sessionToken } })
}
