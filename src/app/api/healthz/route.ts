// src/app/api/healthz/route.ts
export function GET() {
  return Response.json({ ok: true })
}
