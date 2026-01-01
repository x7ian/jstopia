import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function TopicsAdminPage() {
  const [chapters, topics, docPages] = await Promise.all([
    prisma.chapter.findMany({ orderBy: { order: 'asc' }, include: { book: true } }),
    prisma.topic.findMany({ orderBy: { order: 'asc' }, include: { chapter: { include: { book: true } }, docPage: true } }),
    prisma.docPage.findMany({ orderBy: { title: 'asc' } }),
  ])

  async function createTopic(formData: FormData) {
    'use server'
    const chapterId = Number(formData.get('chapterId') ?? 0)
    const slug = String(formData.get('slug') ?? '').trim()
    const title = String(formData.get('title') ?? '').trim()
    const order = Number(formData.get('order') ?? 0)
    const storyIntro = String(formData.get('storyIntro') ?? '').trim()
    const lockedByDefault = String(formData.get('lockedByDefault') ?? '') === 'on'
    const docPageIdRaw = String(formData.get('docPageId') ?? '').trim()
    const docPageId = docPageIdRaw ? Number(docPageIdRaw) : null

    if (!chapterId || !slug || !title) return

    await prisma.topic.create({
      data: {
        chapterId,
        slug,
        title,
        order: Number.isFinite(order) ? order : 0,
        storyIntro: storyIntro || null,
        lockedByDefault,
        docPageId: docPageId && Number.isFinite(docPageId) ? docPageId : null,
      },
    })

    redirect('/admin/topics')
  }

  async function deleteTopic(formData: FormData) {
    'use server'
    const id = Number(formData.get('id') ?? 0)
    if (!id) return
    await prisma.topic.delete({ where: { id } })
    redirect('/admin/topics')
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create Lesson</h2>
        <form action={createTopic} className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">Chapter</label>
              <select name="chapterId" className="w-full rounded border px-2 py-1" required>
                <option value="">Select chapter</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.book.title} / {chapter.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Doc Page (optional)</label>
              <select name="docPageId" className="w-full rounded border px-2 py-1">
                <option value="">No doc page</option>
                {docPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">Slug</label>
              <input name="slug" className="w-full rounded border px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm">Title</label>
              <input name="title" className="w-full rounded border px-2 py-1" required />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">Order</label>
              <input name="order" type="number" className="w-full rounded border px-2 py-1" defaultValue={0} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="lockedByDefault" className="rounded border" />
              Locked by default
            </label>
          </div>
          <div>
            <label className="block text-sm">Story Intro</label>
            <textarea name="storyIntro" className="w-full rounded border px-2 py-1" />
          </div>
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Create Lesson
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Lessons</h2>
        <div className="divide-y rounded border border-slate-200 bg-white">
          {topics.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium">{topic.title}</div>
                <div className="text-neutral-600">
                  {topic.chapter.book.title} / {topic.chapter.title} · {topic.slug} · order {topic.order} ·{' '}
                  {topic.lockedByDefault ? 'locked' : 'unlocked'}
                </div>
              </div>
              <form action={deleteTopic}>
                <input type="hidden" name="id" value={topic.id} />
                <button className="text-red-600 underline" type="submit">
                  delete
                </button>
              </form>
            </div>
          ))}
          {topics.length === 0 && <div className="p-3 text-sm text-neutral-600">No lessons yet.</div>}
        </div>
      </section>
    </div>
  )
}
