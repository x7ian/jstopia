import { BOOK1_SLUG } from '@/lib/ranks/book1'
import { getRankBySlug } from '@/lib/ranks/utils'

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { sessionToken?: string; bookSlug?: string; rankSlug?: string }
    | null

  const rankSlug = body?.rankSlug?.trim()
  if (!body?.sessionToken || !rankSlug) {
    return Response.json({ ok: false, error: 'sessionToken and rankSlug are required' }, { status: 400 })
  }

  const rank = getRankBySlug(rankSlug)
  if (!rank || rank.slug !== rankSlug || !rank.bossExam) {
    return Response.json({ ok: false, error: 'Boss exam not found' }, { status: 404 })
  }

  return Response.json({
    ok: true,
    data: {
      bookSlug: body.bookSlug?.trim() ?? BOOK1_SLUG,
      rankSlug,
      rules: rank.bossExam,
    },
  })
}

