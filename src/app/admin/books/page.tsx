import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function BooksAdminPage() {
  const books = await prisma.book.findMany({ orderBy: { order: 'asc' } })

  async function createBook(formData: FormData) {
    'use server'
    const slug = String(formData.get('slug') ?? '').trim()
    const title = String(formData.get('title') ?? '').trim()
    const order = Number(formData.get('order') ?? 0)
    const storyIntro = String(formData.get('storyIntro') ?? '').trim()
    const lockedByDefault = String(formData.get('lockedByDefault') ?? '') === 'on'
    const themeJsonRaw = String(formData.get('themeJson') ?? '').trim()
    const themeJson = themeJsonRaw ? JSON.parse(themeJsonRaw) : null

    if (!slug || !title) return

    await prisma.book.create({
      data: {
        slug,
        title,
        order: Number.isFinite(order) ? order : 0,
        storyIntro: storyIntro || null,
        lockedByDefault,
        themeJson,
      },
    })

    redirect('/admin/books')
  }

  async function deleteBook(formData: FormData) {
    'use server'
    const id = Number(formData.get('id') ?? 0)
    if (!id) return
    await prisma.book.delete({ where: { id } })
    redirect('/admin/books')
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create Book</h2>
        <form action={createBook} className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow">
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
          <div>
            <label className="block text-sm">Theme JSON (optional)</label>
            <textarea name="themeJson" className="w-full rounded border px-2 py-1 font-mono text-xs" rows={3} />
          </div>
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Create Book
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Books</h2>
        <div className="divide-y rounded border border-slate-200 bg-white">
          {books.map((book) => (
            <div key={book.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium">{book.title}</div>
                <div className="text-neutral-600">
                  {book.slug} · order {book.order} · {book.lockedByDefault ? 'locked' : 'unlocked'}
                </div>
              </div>
              <form action={deleteBook}>
                <input type="hidden" name="id" value={book.id} />
                <button className="text-red-600 underline" type="submit">
                  delete
                </button>
              </form>
            </div>
          ))}
          {books.length === 0 && <div className="p-3 text-sm text-neutral-600">No books yet.</div>}
        </div>
      </section>
    </div>
  )
}
