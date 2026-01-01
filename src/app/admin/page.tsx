import { prisma } from '@/lib/db'

export default async function AdminHome() {
  const [books, chapters, topics, pages, blocks, questions] = await Promise.all([
    prisma.book.count(),
    prisma.chapter.count(),
    prisma.topic.count(),
    prisma.docPage.count(),
    prisma.docBlock.count(),
    prisma.question.count(),
  ])

  const stats = [
    { label: 'Books', value: books },
    { label: 'Chapters', value: chapters },
    { label: 'Lessons', value: topics },
    { label: 'Doc Pages', value: pages },
    { label: 'Doc Blocks', value: blocks },
    { label: 'Questions', value: questions },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-neutral-600">
        Manage the learning journey structure, documentation, and quizzes.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm text-neutral-500">{stat.label}</div>
            <div className="text-2xl font-semibold">{stat.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
