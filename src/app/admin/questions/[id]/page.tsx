import { prisma } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'

function parseJson(value: string, fallback: any) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

export default async function EditQuestionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = Number(params?.id ?? 0)
  if (!id) return notFound()

  const [question, topics, docPages, docBlocks] = await Promise.all([
    prisma.question.findUnique({ where: { id } }),
    prisma.topic.findMany({ orderBy: { order: 'asc' } }),
    prisma.docPage.findMany({ orderBy: { title: 'asc' } }),
    prisma.docBlock.findMany({ orderBy: { order: 'asc' }, include: { docPage: true } }),
  ])

  if (!question) return notFound()

  async function update(formData: FormData) {
    'use server'
    const slug = String(formData.get('slug') ?? '').trim()
    const topicId = Number(formData.get('topicId') ?? 0)
    const difficulty = String(formData.get('difficulty') ?? 'basic') as 'basic' | 'medium' | 'advanced'
    const type = String(formData.get('type') ?? 'mcq') as 'mcq' | 'code_output' | 'code_complete' | 'code'
    const prompt = String(formData.get('prompt') ?? '').trim()
    const code = String(formData.get('code') ?? '').trim()
    const choicesJsonRaw = String(formData.get('choicesJson') ?? '').trim()
    const answer = String(formData.get('answer') ?? '').trim()
    const tip1 = String(formData.get('tip1') ?? '').trim()
    const tip2 = String(formData.get('tip2') ?? '').trim()
    const explanationShort = String(formData.get('explanationShort') ?? '').trim()
    const referencesJsonRaw = String(formData.get('referencesJson') ?? '').trim()
    const docPageIdRaw = String(formData.get('docPageId') ?? '').trim()
    const answerDocBlockIdRaw = String(formData.get('answerDocBlockId') ?? '').trim()

    if (!slug || !topicId || !prompt || !answer || !tip1 || !explanationShort) return

    const choicesJson = choicesJsonRaw ? parseJson(choicesJsonRaw, null) : null
    const referencesJson = referencesJsonRaw ? parseJson(referencesJsonRaw, []) : []

    await prisma.question.update({
      where: { id },
      data: {
        slug,
        topicId,
        difficulty,
        type,
        prompt,
        code: code || null,
        choicesJson,
        answer,
        tip1,
        tip2: tip2 || null,
        explanationShort,
        referencesJson,
        docPageId: docPageIdRaw ? Number(docPageIdRaw) : null,
        answerDocBlockId: answerDocBlockIdRaw ? Number(answerDocBlockIdRaw) : null,
      },
    })

    redirect('/admin/questions')
  }

  async function remove() {
    'use server'
    await prisma.question.delete({ where: { id } })
    redirect('/admin/questions')
  }

  return (
    <form action={update} className="space-y-4 w-full bg-white text-slate-900 p-4 rounded border border-slate-200 shadow">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Edit Question</h2>
        <button formAction={remove} className="rounded bg-red-600 text-white px-3 py-2" type="submit">
          Delete
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm">Slug</label>
          <input name="slug" className="border rounded px-2 py-1 w-full bg-white text-slate-900" defaultValue={question.slug} />
        </div>
        <div>
          <label className="block text-sm">Lesson</label>
          <select name="topicId" className="border rounded px-2 py-1 w-full bg-white text-slate-900" defaultValue={question.topicId}>
            {topics.map((topic) => (
              <option key={topic.id} value={topic.id}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Doc Page (optional)</label>
          <select name="docPageId" className="border rounded px-2 py-1 w-full bg-white text-slate-900" defaultValue={question.docPageId ?? ''}>
            <option value="">No doc page</option>
            {docPages.map((page) => (
              <option key={page.id} value={page.id}>
                {page.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Difficulty</label>
          <select name="difficulty" className="border rounded px-2 py-1 w-full bg-white text-slate-900" defaultValue={question.difficulty}>
            <option value="basic">basic</option>
            <option value="medium">medium</option>
            <option value="advanced">advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-sm">Type</label>
          <select name="type" className="border rounded px-2 py-1 w-full bg-white text-slate-900" defaultValue={question.type}>
            <option value="mcq">mcq</option>
            <option value="code_output">code_output</option>
            <option value="code_complete">code_complete</option>
            <option value="code">code</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm">Prompt</label>
        <textarea name="prompt" className="border rounded px-2 py-1 w-full h-24 bg-white text-slate-900" defaultValue={question.prompt} />
      </div>

      <div>
        <label className="block text-sm">Code (optional)</label>
        <textarea name="code" className="border rounded px-2 py-1 w-full h-24 bg-white text-slate-900 font-mono text-xs" defaultValue={question.code ?? ''} />
      </div>

      <div>
        <label className="block text-sm">Choices JSON (optional)</label>
        <textarea
          name="choicesJson"
          className="border rounded px-2 py-1 w-full h-24 bg-white text-slate-900 font-mono text-xs"
          defaultValue={question.choicesJson ? JSON.stringify(question.choicesJson, null, 2) : ''}
        />
      </div>

      <div>
        <label className="block text-sm">Answer</label>
        <input name="answer" className="border rounded px-2 py-1 w-full bg-white text-slate-900" defaultValue={question.answer} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm">Tip 1</label>
          <textarea name="tip1" className="border rounded px-2 py-1 w-full h-20 bg-white text-slate-900" defaultValue={question.tip1} />
        </div>
        <div>
          <label className="block text-sm">Tip 2 (optional)</label>
          <textarea name="tip2" className="border rounded px-2 py-1 w-full h-20 bg-white text-slate-900" defaultValue={question.tip2 ?? ''} />
        </div>
      </div>

      <div>
        <label className="block text-sm">Explanation</label>
        <textarea name="explanationShort" className="border rounded px-2 py-1 w-full h-24 bg-white text-slate-900" defaultValue={question.explanationShort} />
      </div>

      <div>
        <label className="block text-sm">References JSON (optional)</label>
        <textarea
          name="referencesJson"
          className="border rounded px-2 py-1 w-full h-20 bg-white text-slate-900 font-mono text-xs"
          defaultValue={question.referencesJson ? JSON.stringify(question.referencesJson, null, 2) : ''}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm">Answer Doc Block (optional)</label>
          <select name="answerDocBlockId" className="border rounded px-2 py-1 w-full bg-white text-slate-900" defaultValue={question.answerDocBlockId ?? ''}>
            <option value="">No doc block</option>
            {docBlocks.map((block) => (
              <option key={block.id} value={block.id}>
                {block.docPage.title} / {block.anchor}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button className="rounded bg-black text-white px-3 py-2" type="submit">
        Save
      </button>
    </form>
  )
}
