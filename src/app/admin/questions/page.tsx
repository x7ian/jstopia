import Link from 'next/link'
import { prisma } from '@/lib/db'

export default async function QuestionsAdminPage() {
  const questions = await prisma.question.findMany({
    orderBy: { id: 'asc' },
    include: { topic: true },
    take: 200,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Questions</h2>
        <Link href="/admin/questions/new" className="rounded bg-black text-white px-3 py-2">
          New Question
        </Link>
      </div>

      <div className="divide-y rounded border border-slate-200 bg-white">
        {questions.map((question) => (
          <div key={question.id} className="flex flex-col gap-2 p-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-sm text-neutral-600">Lesson: {question.topic.title}</div>
              <div className="font-medium text-neutral-900">{question.prompt.slice(0, 120)}{question.prompt.length > 120 ? '…' : ''}</div>
              <div className="text-xs text-neutral-500">
                {question.slug} · {question.difficulty} · {question.type}
              </div>
            </div>
            <div className="flex gap-3 text-sm">
              <Link href={`/admin/questions/${question.id}`} className="underline">
                edit
              </Link>
            </div>
          </div>
        ))}
        {questions.length === 0 && <div className="p-4 text-sm text-neutral-600">No questions yet.</div>}
      </div>
    </div>
  )
}
