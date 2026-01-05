import { prisma } from '@/lib/db'
import { loadMdx } from '@/lib/docs/loadMdx'
import { TopicExperience } from '@/components/TopicExperience'
import { DocScrollbook } from '@/components/DocScrollbook'

export default async function TopicPage(props: { params: Promise<{ topicSlug: string }> }) {
  const params = await props.params
  const topicSlug = params.topicSlug

  const topic = await prisma.topic.findUnique({
    where: { slug: topicSlug },
    include: {
      chapter: { include: { book: true, topics: { orderBy: { order: 'asc' } } } },
      docPage: { include: { blocks: { orderBy: { order: 'asc' } } } },
    },
  })

  if (!topic) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center px-6 py-12">
        <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-6 text-sm text-rose-100">
          Lesson not found.
        </div>
      </div>
    )
  }

  const docSource = topic.docPage ? await loadMdx(topic.docPage.mdxPath) : ''
  const objectives = Array.isArray(topic.docPage?.objectives) ? (topic.docPage?.objectives as string[]) : []

  const noQuizLessons = new Set(['prologue-welcome', 'prologue-browser-wars', 'prologue-where-js-lives'])
  const hasQuiz = !noQuizLessons.has(topic.slug)
  const microQuestions = hasQuiz
    ? await prisma.question.findMany({
        where: { topicId: topic.id, phase: 'micro' },
        include: { answerDocBlock: true },
        orderBy: { id: 'asc' },
      })
    : []

  const quizCount = hasQuiz
    ? await prisma.question.count({
        where: { topicId: topic.id, phase: 'quiz' },
      })
    : 0

  const chapterTopics = topic.chapter.topics
  const currentIndex = chapterTopics.findIndex((item) => item.id === topic.id)
  const nextTopic = currentIndex >= 0 ? chapterTopics[currentIndex + 1] : null

  return (
    <TopicExperience
      topic={{ slug: topic.slug, title: topic.title, storyIntro: topic.storyIntro }}
      chapter={{ title: topic.chapter.title }}
      book={{ title: topic.chapter.book.title, slug: topic.chapter.book.slug }}
      doc={
        topic.docPage
          ? {
              title: topic.docPage.title,
              objectives,
              estimatedMinutes: topic.docPage.estimatedMinutes,
            }
          : null
      }
      docContent={
        topic.docPage ? <DocScrollbook source={docSource} microQuestions={[]} /> : null
      }
      docContentWithMicro={
        topic.docPage ? (
          <DocScrollbook
            source={docSource}
            microQuestions={microQuestions.map((question) => ({
              id: question.id,
              prompt: question.prompt,
              type: question.type,
              choicesJson: question.choicesJson as any,
              answer: question.answer,
              answerDocBlockAnchor: question.answerDocBlock?.anchor ?? null,
            }))}
          />
        ) : null
      }
      docBlocks={
        topic.docPage?.blocks.map((block) => ({
          id: block.id,
          anchor: block.anchor,
          title: block.title,
          kind: block.kind,
          excerpt: block.excerpt,
          taskQuestionId: block.taskQuestionId ?? null,
        })) ?? []
      }
      microQuestions={microQuestions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        type: question.type,
        choicesJson: question.choicesJson as any,
        answer: question.answer,
        tip1: question.tip1,
        tip2: question.tip2,
        filesJson: question.filesJson as any,
        expectedJson: question.expectedJson as any,
        answerDocBlockAnchor: question.answerDocBlock?.anchor ?? null,
      }))}
      nav={{ nextTopicSlug: nextTopic?.slug ?? null }}
      quizCount={quizCount}
    />
  )
}
