import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import {
  questionsSeed,
  constQuestionsSeed,
  prologueWelcomeQuestions,
  prologueFinalQuestions,
} from './seed-questions'

const prisma = new PrismaClient()

async function upsertTopicWithDocs(params: {
  chapterId: number
  topic: { slug: string; title: string; order: number; lockedByDefault: boolean; storyIntro: string }
  docPage: { slug: string; title: string; mdxPath: string; objectives: string[]; estimatedMinutes: number }
  blocks: { anchor: string; kind: string; order: number; title: string; excerpt: string }[]
  questions: {
    slug: string
    difficulty: 'basic' | 'medium' | 'advanced'
    type: 'mcq' | 'code_output' | 'code_complete' | 'code'
    phase?: 'micro' | 'quiz' | 'boss'
    rankSlug?: string | null
    docPageSlug?: string
    prompt: string
    code?: string
    choices?: ReadonlyArray<{ id: string; text: string }>
    files?: { name: string; language: 'html' | 'css' | 'js'; content: string }[]
    expected?: { mode: 'consoleIncludes' | 'domTextEquals' | 'noConsoleErrors'; value?: string }
    answer: string
    tip1: string
    tip2?: string
    explanationShort: string
    references?: string[]
    answerDocBlockAnchor: string
  }[]
}) {
  const topic = await prisma.topic.upsert({
    where: { slug: params.topic.slug },
    update: {
      chapterId: params.chapterId,
      title: params.topic.title,
      order: params.topic.order,
      lockedByDefault: params.topic.lockedByDefault,
      storyIntro: params.topic.storyIntro,
    },
    create: {
      chapterId: params.chapterId,
      slug: params.topic.slug,
      title: params.topic.title,
      order: params.topic.order,
      lockedByDefault: params.topic.lockedByDefault,
      storyIntro: params.topic.storyIntro,
    },
  })

  const docPage = await prisma.docPage.upsert({
    where: { slug: params.docPage.slug },
    update: {
      title: params.docPage.title,
      mdxPath: params.docPage.mdxPath,
      chapterId: params.chapterId,
      topicId: topic.id,
      objectives: params.docPage.objectives,
      estimatedMinutes: params.docPage.estimatedMinutes,
    },
    create: {
      slug: params.docPage.slug,
      title: params.docPage.title,
      mdxPath: params.docPage.mdxPath,
      chapterId: params.chapterId,
      topicId: topic.id,
      objectives: params.docPage.objectives,
      estimatedMinutes: params.docPage.estimatedMinutes,
    },
  })

  for (const block of params.blocks) {
    await prisma.docBlock.upsert({
      where: { docPageId_anchor: { docPageId: docPage.id, anchor: block.anchor } },
      update: {
        kind: block.kind,
        order: block.order,
        title: block.title,
        excerpt: block.excerpt,
      },
      create: {
        docPageId: docPage.id,
        ...block,
      },
    })
  }

  const blocks = await prisma.docBlock.findMany({ where: { docPageId: docPage.id } })
  const blockIdByAnchor = new Map(blocks.map((block) => [block.anchor, block.id]))
  const docPageCache = new Map<
    string,
    { id: number; blockIdByAnchor: Map<string, number> }
  >([[docPage.slug, { id: docPage.id, blockIdByAnchor }]])

  for (const question of params.questions) {
    const targetDocSlug = question.docPageSlug ?? docPage.slug
    let targetDoc = docPageCache.get(targetDocSlug)
    if (!targetDoc) {
      const externalDoc = await prisma.docPage.findUnique({ where: { slug: targetDocSlug } })
      if (!externalDoc) {
        throw new Error(`Missing DocPage for question ${question.slug}: ${targetDocSlug}`)
      }
      const externalBlocks = await prisma.docBlock.findMany({ where: { docPageId: externalDoc.id } })
      targetDoc = {
        id: externalDoc.id,
        blockIdByAnchor: new Map(externalBlocks.map((block) => [block.anchor, block.id])),
      }
      docPageCache.set(targetDocSlug, targetDoc)
    }
    const answerDocBlockId = targetDoc.blockIdByAnchor.get(question.answerDocBlockAnchor)
    if (!answerDocBlockId) {
      throw new Error(`Missing DocBlock anchor: ${question.answerDocBlockAnchor}`)
    }

    const savedQuestion = await prisma.question.upsert({
      where: { slug: question.slug },
      update: {
        topicId: topic.id,
        difficulty: question.difficulty,
        type: question.type,
        phase: question.phase ?? 'quiz',
        rankSlug: question.rankSlug ?? null,
        prompt: question.prompt,
        code: question.code ?? null,
        choicesJson: question.choices ?? undefined,
        filesJson: question.files ?? undefined,
        expectedJson: question.expected ?? undefined,
        answer: question.answer,
        tip1: question.tip1,
        tip2: question.tip2 ?? null,
        explanationShort: question.explanationShort,
        referencesJson: question.references ?? [],
        docPageId: targetDoc.id,
        answerDocBlockId,
      },
      create: {
        slug: question.slug,
        topicId: topic.id,
        difficulty: question.difficulty,
        type: question.type,
        phase: question.phase ?? 'quiz',
        rankSlug: question.rankSlug ?? null,
        prompt: question.prompt,
        code: question.code ?? null,
        choicesJson: question.choices ?? undefined,
        filesJson: question.files ?? undefined,
        expectedJson: question.expected ?? undefined,
        answer: question.answer,
        tip1: question.tip1,
        tip2: question.tip2 ?? null,
        explanationShort: question.explanationShort,
        referencesJson: question.references ?? [],
        docPageId: targetDoc.id,
        answerDocBlockId,
      },
    })

    if ((question.phase ?? 'quiz') === 'micro') {
      await prisma.docBlock.updateMany({
        where: { id: answerDocBlockId, taskQuestionId: null },
        data: { taskQuestionId: savedQuestion.id },
      })
    }
  }

  await prisma.topic.update({
    where: { id: topic.id },
    data: { docPageId: docPage.id },
  })

  return { topic, docPage }
}

async function main() {
  const book = await prisma.book.upsert({
    where: { slug: 'javascriptopia-vanillaland-foundations' },
    update: {
      title: 'JavaScriptopia: VanillaLand (Foundations)',
      order: 1,
      lockedByDefault: false,
      storyIntro:
        'Welcome to VanillaLand. In Data Forest you learn how data lives and moves. First: variables.',
    },
    create: {
      slug: 'javascriptopia-vanillaland-foundations',
      title: 'JavaScriptopia: VanillaLand (Foundations)',
      order: 1,
      lockedByDefault: false,
      storyIntro:
        'Welcome to VanillaLand. In Data Forest you learn how data lives and moves. First: variables.',
    },
  })

  const prologueChapter = await prisma.chapter.upsert({
    where: { bookId_slug: { bookId: book.id, slug: 'prologue-browser-wars' } },
    update: {
      title: 'Prologue — The Browser Wars',
      order: 0,
      lockedByDefault: false,
      storyIntro: 'Story + real history + where JavaScript runs.',
    },
    create: {
      bookId: book.id,
      slug: 'prologue-browser-wars',
      title: 'Prologue — The Browser Wars',
      order: 0,
      lockedByDefault: false,
      storyIntro: 'Story + real history + where JavaScript runs.',
    },
  })

  await upsertTopicWithDocs({
    chapterId: prologueChapter.id,
    topic: {
      slug: 'prologue-welcome',
      title: 'Welcome to JavaScriptopia',
      order: 1,
      lockedByDefault: false,
      storyIntro: 'Step into the Academy gates and learn how this journey works.',
    },
    docPage: {
      slug: 'javascriptopia-vanillaland-foundations/prologue-browser-wars/prologue-welcome',
      title: 'Welcome to JavaScriptopia',
      mdxPath: 'content/book/javascriptopia-vanillaland-foundations/prologue-browser-wars/prologue-welcome.mdx',
      objectives: [
        'Understand what JavaScriptopia is',
        'Learn how Learn and Challenge modes work',
        'Understand the Teleport to Explanation feature',
        'Preview the long-term goal (Runtime + Loop)',
      ],
      estimatedMinutes: 6,
    },
    blocks: [
      { anchor: 'welcome-to-javascriptopia', kind: 'explanation', order: 1, title: 'Welcome to JavaScriptopia', excerpt: 'Story and onboarding.' },
      { anchor: 'how-this-journey-works', kind: 'rule', order: 2, title: 'How this journey works', excerpt: 'Docs + challenges.' },
      { anchor: 'learn-vs-challenge', kind: 'example', order: 3, title: 'Learn vs Challenge', excerpt: 'Two modes.' },
      { anchor: 'teleport-explanation', kind: 'example', order: 4, title: 'Teleport to explanation', excerpt: 'Jump to the doc block.' },
      { anchor: 'future-goals', kind: 'rule', order: 5, title: 'Future goals', excerpt: 'Runtime and Loop later.' },
      { anchor: 'campfire-checklist', kind: 'rule', order: 6, title: 'Campfire Checklist', excerpt: 'Review and confirm.' },
    ],
    questions: [...prologueWelcomeQuestions],
  })

  await upsertTopicWithDocs({
    chapterId: prologueChapter.id,
    topic: {
      slug: 'prologue-browser-wars',
      title: 'The Browser Wars (Real History)',
      order: 2,
      lockedByDefault: false,
      storyIntro: 'The real-world origin story behind modern browsers.',
    },
    docPage: {
      slug: 'javascriptopia-vanillaland-foundations/prologue-browser-wars/prologue-browser-wars',
      title: 'The Browser Wars (Real History)',
      mdxPath: 'content/book/javascriptopia-vanillaland-foundations/prologue-browser-wars/prologue-browser-wars.mdx',
      objectives: [
        'Learn the high-level story of the first Browser War',
        'Know the two main companies and why it mattered',
        'See where to read the real sources',
      ],
      estimatedMinutes: 6,
    },
    blocks: [
      { anchor: 'browser-wars-intro', kind: 'explanation', order: 1, title: 'The first Browser War', excerpt: 'High-level era.' },
      { anchor: 'browser-wars-protagonists', kind: 'example', order: 2, title: 'The protagonists', excerpt: 'Microsoft vs Netscape.' },
      { anchor: 'why-it-mattered', kind: 'rule', order: 3, title: 'Why it mattered', excerpt: 'Standards + platforms.' },
      { anchor: 'further-reading', kind: 'rule', order: 4, title: 'Further reading', excerpt: 'Real sources.' },
      { anchor: 'campfire-checklist', kind: 'rule', order: 5, title: 'Campfire Checklist', excerpt: 'Review the basics.' },
    ],
    questions: [],
  })

  await upsertTopicWithDocs({
    chapterId: prologueChapter.id,
    topic: {
      slug: 'prologue-where-js-lives',
      title: 'Where JavaScript Lives',
      order: 3,
      lockedByDefault: false,
      storyIntro: 'JavaScript runs in different environments.',
    },
    docPage: {
      slug: 'javascriptopia-vanillaland-foundations/prologue-browser-wars/prologue-where-js-lives',
      title: 'Where JavaScript Lives',
      mdxPath: 'content/book/javascriptopia-vanillaland-foundations/prologue-browser-wars/prologue-where-js-lives.mdx',
      objectives: [
        'Understand that JS runs in different environments',
        'Know the difference between browser and server',
        'Understand what a browser is at a high level',
      ],
      estimatedMinutes: 6,
    },
    blocks: [
      { anchor: 'what-is-a-browser', kind: 'explanation', order: 1, title: 'What is a browser?', excerpt: 'Engine + APIs.' },
      { anchor: 'js-in-the-browser', kind: 'example', order: 2, title: 'JS in the browser', excerpt: 'Script tags and modules.' },
      { anchor: 'js-on-the-server', kind: 'example', order: 3, title: 'JS on the server', excerpt: 'Node basics.' },
      { anchor: 'environments-summary', kind: 'rule', order: 4, title: 'Different environments', excerpt: 'APIs differ by environment.' },
      { anchor: 'campfire-checklist', kind: 'rule', order: 5, title: 'Campfire Checklist', excerpt: 'Review the basics.' },
    ],
    questions: [],
  })

  await upsertTopicWithDocs({
    chapterId: prologueChapter.id,
    topic: {
      slug: 'prologue-final-quiz',
      title: 'Prologue Trial',
      order: 4,
      lockedByDefault: false,
      storyIntro: 'A final check before Data Forest.',
    },
    docPage: {
      slug: 'javascriptopia-vanillaland-foundations/prologue-browser-wars/prologue-final-quiz',
      title: 'Prologue Trial',
      mdxPath: 'content/book/javascriptopia-vanillaland-foundations/prologue-browser-wars/prologue-final-quiz.mdx',
      objectives: [
        'Pass the Prologue Trial',
        'Unlock Data Forest',
      ],
      estimatedMinutes: 8,
    },
    blocks: [
      { anchor: 'trial-rules', kind: 'rule', order: 1, title: 'Trial rules', excerpt: 'Fill all 5 bars.' },
      { anchor: 'what-you-should-know', kind: 'explanation', order: 2, title: 'What you should know', excerpt: 'Welcome, wars, environments.' },
      { anchor: 'start-training-cta', kind: 'example', order: 3, title: 'Start training', excerpt: 'Enter Data Forest.' },
    ],
    questions: [...prologueFinalQuestions],
  })

  const chapter = await prisma.chapter.upsert({
    where: { bookId_slug: { bookId: book.id, slug: 'data-forest' } },
    update: {
      title: 'Data Forest',
      order: 1,
      lockedByDefault: false,
      storyIntro: 'In Data Forest you learn how to store, name, and reason about values.',
    },
    create: {
      bookId: book.id,
      slug: 'data-forest',
      title: 'Data Forest',
      order: 1,
      lockedByDefault: false,
      storyIntro: 'In Data Forest you learn how to store, name, and reason about values.',
    },
  })

  const topic = await prisma.topic.upsert({
    where: { slug: 'variables-let-var' },
    update: {
      chapterId: chapter.id,
      title: 'Creating Variables with let and var',
      order: 1,
      lockedByDefault: false,
      storyIntro: 'At the campfire, you learn how to store values in named containers: variables.',
    },
    create: {
      chapterId: chapter.id,
      slug: 'variables-let-var',
      title: 'Creating Variables with let and var',
      order: 1,
      lockedByDefault: false,
      storyIntro: 'At the campfire, you learn how to store values in named containers: variables.',
    },
  })

  const docPage = await prisma.docPage.upsert({
    where: { slug: 'javascriptopia-vanillaland-foundations/data-forest/variables-let-var' },
    update: {
      title: 'Variables with let and var',
      mdxPath: 'content/book/javascriptopia-vanillaland-foundations/data-forest/variables-let-var.mdx',
      chapterId: chapter.id,
      topicId: topic.id,
      estimatedMinutes: 15,
      objectives: [
        'Declare, initialize, and update variables.',
        'Explain the difference between let and var at a practical level.',
        'Apply safe naming rules (camelCase, descriptive names) to avoid bugs.',
        'Predict scoping behavior for let vs var (block vs function/global).',
        'Avoid common mistakes like redeclaration and accidental globals.',
      ],
    },
    create: {
      slug: 'javascriptopia-vanillaland-foundations/data-forest/variables-let-var',
      title: 'Variables with let and var',
      mdxPath: 'content/book/javascriptopia-vanillaland-foundations/data-forest/variables-let-var.mdx',
      chapterId: chapter.id,
      topicId: topic.id,
      estimatedMinutes: 15,
      objectives: [
        'Declare, initialize, and update variables.',
        'Explain the difference between let and var at a practical level.',
        'Apply safe naming rules (camelCase, descriptive names) to avoid bugs.',
        'Predict scoping behavior for let vs var (block vs function/global).',
        'Avoid common mistakes like redeclaration and accidental globals.',
      ],
    },
  })

  const blocksData = [
    {
      anchor: 'what-is-a-variable',
      kind: 'explanation',
      order: 1,
      title: 'What is a variable?',
      excerpt: 'Variables are named containers for values you can read and update.',
    },
    {
      anchor: 'declaring-vs-initializing',
      kind: 'rule',
      order: 2,
      title: 'Declaring vs initializing',
      excerpt: 'Declaring creates a variable; initializing gives it a value.',
    },
    {
      anchor: 'let-basics',
      kind: 'example',
      order: 3,
      title: 'let: modern variable',
      excerpt: 'Reassignable and block-scoped; the modern default.',
    },
    {
      anchor: 'var-basics',
      kind: 'example',
      order: 4,
      title: 'var: legacy behavior',
      excerpt: 'Function-scoped and hoisted; avoid in new code.',
    },
    {
      anchor: 'block-scope-vs-function-scope',
      kind: 'gotcha',
      order: 5,
      title: 'Scope difference: block vs function',
      excerpt: 'let respects blocks; var ignores them.',
    },
    {
      anchor: 'hoisting-high-level',
      kind: 'gotcha',
      order: 6,
      title: 'Hoisting (high-level, practical)',
      excerpt: 'var hoists to undefined; let lives in the TDZ.',
    },
    {
      anchor: 'naming-and-typo-tips',
      kind: 'rule',
      order: 7,
      title: 'Naming & typo prevention tips',
      excerpt: 'Use camelCase, descriptive names, and avoid confusing characters.',
    },
    {
      anchor: 'common-mistakes',
      kind: 'warning',
      order: 8,
      title: 'Common mistakes',
      excerpt: 'Avoid accidental globals, redeclaration, and shadowing confusion.',
    },
    {
      anchor: 'micro-challenges',
      kind: 'example',
      order: 9,
      title: 'Micro-challenges',
      excerpt: 'Try short snippets and predict the output.',
    },
    {
      anchor: 'campfire-checklist',
      kind: 'rule',
      order: 10,
      title: 'Campfire Checklist',
      excerpt: 'Review the key takeaways before moving on.',
    },
  ]

  for (const block of blocksData) {
    await prisma.docBlock.upsert({
      where: { docPageId_anchor: { docPageId: docPage.id, anchor: block.anchor } },
      update: {
        kind: block.kind,
        order: block.order,
        title: block.title,
        excerpt: block.excerpt,
      },
      create: {
        docPageId: docPage.id,
        ...block,
      },
    })
  }

  const blocks = await prisma.docBlock.findMany({ where: { docPageId: docPage.id } })
  const blockIdByAnchor = new Map(blocks.map((block) => [block.anchor, block.id]))

  for (const question of questionsSeed) {
    const answerDocBlockId = blockIdByAnchor.get(question.answerDocBlockAnchor)
    if (!answerDocBlockId) {
      throw new Error(`Missing DocBlock anchor: ${question.answerDocBlockAnchor}`)
    }

    await prisma.question.upsert({
      where: { slug: question.slug },
      update: {
        topicId: topic.id,
        difficulty: question.difficulty,
        type: question.type,
        phase: question.phase ?? 'quiz',
        rankSlug: question.rankSlug ?? null,
        prompt: question.prompt,
        code: question.code ?? null,
        choicesJson: question.choices ?? undefined,
        answer: question.answer,
        tip1: question.tip1,
        tip2: question.tip2 ?? null,
        explanationShort: question.explanationShort,
        referencesJson: question.references ?? [],
        docPageId: docPage.id,
        answerDocBlockId,
      },
      create: {
        slug: question.slug,
        topicId: topic.id,
        difficulty: question.difficulty,
        type: question.type,
        phase: question.phase ?? 'quiz',
        rankSlug: question.rankSlug ?? null,
        prompt: question.prompt,
        code: question.code ?? null,
        choicesJson: question.choices ?? undefined,
        answer: question.answer,
        tip1: question.tip1,
        tip2: question.tip2 ?? null,
        explanationShort: question.explanationShort,
        referencesJson: question.references ?? [],
        docPageId: docPage.id,
        answerDocBlockId,
      },
    })
  }

  await prisma.topic.update({
    where: { id: topic.id },
    data: { docPageId: docPage.id },
  })

  const constTopic = await prisma.topic.upsert({
    where: { slug: 'constants-const' },
    update: {
      chapterId: chapter.id,
      title: 'Creating Constants with const',
      order: 2,
      lockedByDefault: true,
      storyIntro:
        'In Data Forest, you now learn to mark values as stable: const is your anchor rope to avoid accidental changes.',
    },
    create: {
      chapterId: chapter.id,
      slug: 'constants-const',
      title: 'Creating Constants with const',
      order: 2,
      lockedByDefault: true,
      storyIntro:
        'In Data Forest, you now learn to mark values as stable: const is your anchor rope to avoid accidental changes.',
    },
  })

  const constDocPage = await prisma.docPage.upsert({
    where: { slug: 'javascriptopia-vanillaland-foundations/data-forest/constants-const' },
    update: {
      title: 'Constants with const',
      mdxPath: 'content/book/javascriptopia-vanillaland-foundations/data-forest/constants-const.mdx',
      chapterId: chapter.id,
      topicId: constTopic.id,
      estimatedMinutes: 12,
      objectives: [
        'Declare constants with const and explain why const is preferred by default.',
        'Distinguish reassignment vs mutation (critical for arrays/objects).',
        'Decide when to use const vs let in real code.',
        'Apply naming conventions: camelCase for const variables; UPPER_SNAKE_CASE for true constants.',
        'Avoid common mistakes like missing initializer, reassignment errors, confusing “const means immutable”.',
        'Recognize const scope/TDZ behavior at a practical level (no deep dive).',
      ],
    },
    create: {
      slug: 'javascriptopia-vanillaland-foundations/data-forest/constants-const',
      title: 'Constants with const',
      mdxPath: 'content/book/javascriptopia-vanillaland-foundations/data-forest/constants-const.mdx',
      chapterId: chapter.id,
      topicId: constTopic.id,
      estimatedMinutes: 12,
      objectives: [
        'Declare constants with const and explain why const is preferred by default.',
        'Distinguish reassignment vs mutation (critical for arrays/objects).',
        'Decide when to use const vs let in real code.',
        'Apply naming conventions: camelCase for const variables; UPPER_SNAKE_CASE for true constants.',
        'Avoid common mistakes like missing initializer, reassignment errors, confusing “const means immutable”.',
        'Recognize const scope/TDZ behavior at a practical level (no deep dive).',
      ],
    },
  })

  const constBlocksData = [
    {
      anchor: 'what-is-const',
      kind: 'explanation',
      order: 1,
      title: 'What is const?',
      excerpt: 'const creates a block-scoped binding that cannot be reassigned.',
    },
    {
      anchor: 'const-requires-initializer',
      kind: 'warning',
      order: 2,
      title: 'const must be initialized',
      excerpt: 'const requires an initializer or it throws a SyntaxError.',
    },
    {
      anchor: 'when-to-use-const',
      kind: 'rule',
      order: 3,
      title: 'When to use const (default choice)',
      excerpt: 'Prefer const by default and switch to let only for reassignment.',
    },
    {
      anchor: 'const-vs-let-decision',
      kind: 'example',
      order: 4,
      title: 'Choosing between const and let',
      excerpt: 'Use let for counters and const for stable references.',
    },
    {
      anchor: 'reassignment-vs-mutation',
      kind: 'gotcha',
      order: 5,
      title: 'Reassignment vs mutation',
      excerpt: 'const blocks reassignment, not mutation.',
    },
    {
      anchor: 'const-with-objects-arrays',
      kind: 'example',
      order: 6,
      title: 'const with objects and arrays',
      excerpt: 'Object/array mutation is allowed; reassigning the binding is not.',
    },
    {
      anchor: 'naming-constants',
      kind: 'rule',
      order: 7,
      title: 'Naming conventions (avoid typos)',
      excerpt: 'Use camelCase for most const values; UPPER_SNAKE_CASE for true constants.',
    },
    {
      anchor: 'common-mistakes-const',
      kind: 'warning',
      order: 8,
      title: 'Common mistakes & misconceptions',
      excerpt: 'const does not make values immutable and is still block-scoped.',
    },
    {
      anchor: 'micro-challenges',
      kind: 'example',
      order: 9,
      title: 'Micro-challenges',
      excerpt: 'Quick practice to spot const pitfalls.',
    },
    {
      anchor: 'campfire-checklist',
      kind: 'rule',
      order: 10,
      title: 'Campfire Checklist',
      excerpt: 'Review the key takeaways before moving on.',
    },
  ]

  for (const block of constBlocksData) {
    await prisma.docBlock.upsert({
      where: { docPageId_anchor: { docPageId: constDocPage.id, anchor: block.anchor } },
      update: {
        kind: block.kind,
        order: block.order,
        title: block.title,
        excerpt: block.excerpt,
      },
      create: {
        docPageId: constDocPage.id,
        ...block,
      },
    })
  }

  const constBlocks = await prisma.docBlock.findMany({ where: { docPageId: constDocPage.id } })
  const constBlockIdByAnchor = new Map(constBlocks.map((block) => [block.anchor, block.id]))

  for (const question of constQuestionsSeed) {
    const answerDocBlockId = constBlockIdByAnchor.get(question.answerDocBlockAnchor)
    if (!answerDocBlockId) {
      throw new Error(`Missing DocBlock anchor: ${question.answerDocBlockAnchor}`)
    }

    await prisma.question.upsert({
      where: { slug: question.slug },
      update: {
        topicId: constTopic.id,
        difficulty: question.difficulty,
        type: question.type,
        phase: question.phase ?? 'quiz',
        rankSlug: question.rankSlug ?? null,
        prompt: question.prompt,
        code: question.code ?? null,
        choicesJson: question.choices ?? undefined,
        answer: question.answer,
        tip1: question.tip1,
        tip2: question.tip2 ?? null,
        explanationShort: question.explanationShort,
        referencesJson: question.references ?? [],
        docPageId: constDocPage.id,
        answerDocBlockId,
      },
      create: {
        slug: question.slug,
        topicId: constTopic.id,
        difficulty: question.difficulty,
        type: question.type,
        phase: question.phase ?? 'quiz',
        rankSlug: question.rankSlug ?? null,
        prompt: question.prompt,
        code: question.code ?? null,
        choicesJson: question.choices ?? undefined,
        answer: question.answer,
        tip1: question.tip1,
        tip2: question.tip2 ?? null,
        explanationShort: question.explanationShort,
        referencesJson: question.references ?? [],
        docPageId: constDocPage.id,
        answerDocBlockId,
      },
    })
  }

  await prisma.topic.update({
    where: { id: constTopic.id },
    data: { docPageId: constDocPage.id },
  })

  await prisma.docPage.upsert({
    where: { slug: 'demo' },
    update: {
      title: 'Docs Demo',
      mdxPath: 'content/book/_demo/docs-demo.mdx',
      estimatedMinutes: 3,
      objectives: [
        'Verify MDX rendering',
        'Verify Callouts + CodeBlock',
        'Verify anchors scroll + highlight',
      ],
    },
    create: {
      slug: 'demo',
      title: 'Docs Demo',
      mdxPath: 'content/book/_demo/docs-demo.mdx',
      estimatedMinutes: 3,
      objectives: [
        'Verify MDX rendering',
        'Verify Callouts + CodeBlock',
        'Verify anchors scroll + highlight',
      ],
    },
  })

  console.log('Seed OK: JavaScriptopia -> Data Forest -> variables-let-var + constants-const')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
