import { prisma } from '@/lib/db'
import { loadMdx } from '@/lib/docs/loadMdx'
import { serialize } from 'next-mdx-remote/serialize'
import remarkGfm from 'remark-gfm'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')?.trim()

  if (!slug) {
    return Response.json({ ok: false, error: 'slug is required' }, { status: 400 })
  }

  const page = await prisma.docPage.findUnique({
    where: { slug },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })

  if (!page) {
    return Response.json({ ok: false, error: 'Doc page not found' }, { status: 404 })
  }

  try {
    const source = await loadMdx(page.mdxPath)
    const mdxSource = await serialize(source, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    })

    return Response.json({
      ok: true,
      data: {
        page: {
          slug: page.slug,
          title: page.title,
          mdxPath: page.mdxPath,
          objectives: page.objectives,
          estimatedMinutes: page.estimatedMinutes,
        },
        blocks: page.blocks.map((block) => ({
          id: block.id,
          anchor: block.anchor,
          title: block.title,
          kind: block.kind,
          order: block.order,
          excerpt: block.excerpt,
        })),
        mdxSource,
      },
    })
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unable to load MDX source.' },
      { status: 500 }
    )
  }
}
