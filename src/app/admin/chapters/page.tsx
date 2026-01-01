import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function ChaptersAdminPage() {
  const [books, chapters] = await Promise.all([
    prisma.book.findMany({ orderBy: { order: 'asc' } }),
    prisma.chapter.findMany({ orderBy: { order: 'asc' }, include: { book: true } }),
  ])

  async function createChapter(formData: FormData) {
    'use server'
    const bookId = Number(formData.get('bookId') ?? 0)
    const slug = String(formData.get('slug') ?? '').trim()
    const title = String(formData.get('title') ?? '').trim()
    const order = Number(formData.get('order') ?? 0)
    const storyIntro = String(formData.get('storyIntro') ?? '').trim()
    const heroImage = String(formData.get('heroImage') ?? '').trim()
    const lockedByDefault = String(formData.get('lockedByDefault') ?? '') === 'on'
    const themeOverrideJsonRaw = String(formData.get('themeOverrideJson') ?? '').trim()
    const themeOverrideJson = themeOverrideJsonRaw ? JSON.parse(themeOverrideJsonRaw) : null

    if (!bookId || !slug || !title) return

    await prisma.chapter.create({
      data: {
        bookId,
        slug,
        title,
        order: Number.isFinite(order) ? order : 0,
        storyIntro: storyIntro || null,
        heroImage: heroImage || null,
        lockedByDefault,
        themeOverrideJson,
      },
    })

    redirect('/admin/chapters')
  }

  async function deleteChapter(formData: FormData) {
    'use server'
    const id = Number(formData.get('id') ?? 0)
    if (!id) return
    await prisma.chapter.delete({ where: { id } })
    redirect('/admin/chapters')
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create Chapter</h2>
        <form action={createChapter} className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">Book</label>
              <select name="bookId" className="w-full rounded border px-2 py-1" required>
                <option value="">Select book</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>
                    {book.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Slug</label>
              <input name="slug" className="w-full rounded border px-2 py-1" required />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">Title</label>
              <input name="title" className="w-full rounded border px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm">Order</label>
              <input name="order" type="number" className="w-full rounded border px-2 py-1" defaultValue={0} />
            </div>
          </div>
          <div>
            <label className="block text-sm">Story Intro</label>
            <textarea name="storyIntro" className="w-full rounded border px-2 py-1" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">Hero Image URL</label>
              <input name="heroImage" className="w-full rounded border px-2 py-1" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="lockedByDefault" className="rounded border" />
              Locked by default
            </label>
          </div>
          <div>
            <label className="block text-sm">Theme Override JSON (optional)</label>
            <textarea name="themeOverrideJson" className="w-full rounded border px-2 py-1 font-mono text-xs" rows={3} />
          </div>
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Create Chapter
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Chapters</h2>
        <div className="divide-y rounded border border-slate-200 bg-white">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium">{chapter.title}</div>
                <div className="text-neutral-600">
                  {chapter.book.title} · {chapter.slug} · order {chapter.order} · {chapter.lockedByDefault ? 'locked' : 'unlocked'}
                </div>
              </div>
              <form action={deleteChapter}>
                <input type="hidden" name="id" value={chapter.id} />
                <button className="text-red-600 underline" type="submit">
                  delete
                </button>
              </form>
            </div>
          ))}
          {chapters.length === 0 && <div className="p-3 text-sm text-neutral-600">No chapters yet.</div>}
        </div>
      </section>
    </div>
  )
}
