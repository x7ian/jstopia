import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function DocsAdminPage() {
  const [chapters, topics, pages, blocks] = await Promise.all([
    prisma.chapter.findMany({ orderBy: { order: 'asc' }, include: { book: true } }),
    prisma.topic.findMany({ orderBy: { order: 'asc' } }),
    prisma.docPage.findMany({ orderBy: { title: 'asc' }, include: { chapter: true, topic: true } }),
    prisma.docBlock.findMany({ orderBy: { order: 'asc' }, include: { docPage: true } }),
  ])

  async function createDocPage(formData: FormData) {
    'use server'
    const slug = String(formData.get('slug') ?? '').trim()
    const title = String(formData.get('title') ?? '').trim()
    const mdxPath = String(formData.get('mdxPath') ?? '').trim()
    const chapterIdRaw = String(formData.get('chapterId') ?? '').trim()
    const topicIdRaw = String(formData.get('topicId') ?? '').trim()
    const objectivesRaw = String(formData.get('objectives') ?? '').trim()
    const estimatedMinutes = Number(formData.get('estimatedMinutes') ?? '')

    if (!slug || !title || !mdxPath) return

    const objectives = objectivesRaw ? objectivesRaw.split('\n').map((line) => line.trim()).filter(Boolean) : null

    await prisma.docPage.create({
      data: {
        slug,
        title,
        mdxPath,
        chapterId: chapterIdRaw ? Number(chapterIdRaw) : null,
        topicId: topicIdRaw ? Number(topicIdRaw) : null,
        objectives,
        estimatedMinutes: Number.isFinite(estimatedMinutes) ? estimatedMinutes : null,
      },
    })

    redirect('/admin/docs')
  }

  async function createDocBlock(formData: FormData) {
    'use server'
    const docPageId = Number(formData.get('docPageId') ?? 0)
    const anchor = String(formData.get('anchor') ?? '').trim()
    const title = String(formData.get('title') ?? '').trim()
    const kind = String(formData.get('kind') ?? '').trim()
    const order = Number(formData.get('order') ?? 0)
    const excerpt = String(formData.get('excerpt') ?? '').trim()
    const contentMd = String(formData.get('contentMd') ?? '').trim()

    if (!docPageId || !anchor || !kind) return

    await prisma.docBlock.create({
      data: {
        docPageId,
        anchor,
        title: title || null,
        kind,
        order: Number.isFinite(order) ? order : 0,
        excerpt: excerpt || null,
        contentMd: contentMd || null,
      },
    })

    redirect('/admin/docs')
  }

  async function deleteDocPage(formData: FormData) {
    'use server'
    const id = Number(formData.get('id') ?? 0)
    if (!id) return
    await prisma.docPage.delete({ where: { id } })
    redirect('/admin/docs')
  }

  async function deleteDocBlock(formData: FormData) {
    'use server'
    const id = Number(formData.get('id') ?? 0)
    if (!id) return
    await prisma.docBlock.delete({ where: { id } })
    redirect('/admin/docs')
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create Doc Page</h2>
        <form action={createDocPage} className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow">
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
              <label className="block text-sm">MDX Path</label>
              <input name="mdxPath" className="w-full rounded border px-2 py-1" required />
            </div>
            <div>
              <label className="block text-sm">Estimated Minutes</label>
              <input name="estimatedMinutes" type="number" className="w-full rounded border px-2 py-1" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">Chapter (optional)</label>
              <select name="chapterId" className="w-full rounded border px-2 py-1">
                <option value="">No chapter</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.book.title} / {chapter.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Lesson (optional)</label>
              <select name="topicId" className="w-full rounded border px-2 py-1">
                <option value="">No lesson</option>
                {topics.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm">Objectives (one per line)</label>
            <textarea name="objectives" className="w-full rounded border px-2 py-1" rows={3} />
          </div>
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Create Doc Page
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Doc Pages</h2>
        <div className="divide-y rounded border border-slate-200 bg-white">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium">{page.title}</div>
                <div className="text-neutral-600">
                  {page.slug} · {page.mdxPath}
                </div>
              </div>
              <form action={deleteDocPage}>
                <input type="hidden" name="id" value={page.id} />
                <button className="text-red-600 underline" type="submit">
                  delete
                </button>
              </form>
            </div>
          ))}
          {pages.length === 0 && <div className="p-3 text-sm text-neutral-600">No doc pages yet.</div>}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Create Doc Block</h2>
        <form action={createDocBlock} className="space-y-3 rounded border border-slate-200 bg-white p-4 shadow">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm">Doc Page</label>
              <select name="docPageId" className="w-full rounded border px-2 py-1" required>
                <option value="">Select page</option>
                {pages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm">Anchor</label>
              <input name="anchor" className="w-full rounded border px-2 py-1" required />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm">Kind</label>
              <input name="kind" className="w-full rounded border px-2 py-1" placeholder="explanation, example" required />
            </div>
            <div>
              <label className="block text-sm">Order</label>
              <input name="order" type="number" className="w-full rounded border px-2 py-1" defaultValue={0} />
            </div>
            <div>
              <label className="block text-sm">Title (optional)</label>
              <input name="title" className="w-full rounded border px-2 py-1" />
            </div>
          </div>
          <div>
            <label className="block text-sm">Excerpt (optional)</label>
            <textarea name="excerpt" className="w-full rounded border px-2 py-1" rows={2} />
          </div>
          <div>
            <label className="block text-sm">Content (optional)</label>
            <textarea name="contentMd" className="w-full rounded border px-2 py-1" rows={3} />
          </div>
          <button className="rounded bg-black px-3 py-2 text-white" type="submit">
            Create Doc Block
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Doc Blocks</h2>
        <div className="divide-y rounded border border-slate-200 bg-white">
          {blocks.map((block) => (
            <div key={block.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <div className="font-medium">{block.anchor}</div>
                <div className="text-neutral-600">
                  {block.docPage.title} · {block.kind} · order {block.order}
                </div>
              </div>
              <form action={deleteDocBlock}>
                <input type="hidden" name="id" value={block.id} />
                <button className="text-red-600 underline" type="submit">
                  delete
                </button>
              </form>
            </div>
          ))}
          {blocks.length === 0 && <div className="p-3 text-sm text-neutral-600">No doc blocks yet.</div>}
        </div>
      </section>
    </div>
  )
}
