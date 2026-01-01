// src/app/api/readyz/route.ts
import { prisma } from '../../../lib/db'

export async function GET() {
  try {
    // Cheap connectivity check
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ ok: true })
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    })
  }
}
