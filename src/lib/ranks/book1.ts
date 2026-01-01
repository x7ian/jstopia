import type { RankDefinition } from '@/lib/ranks/types'

export const BOOK1_SLUG = 'javascriptopia-vanillaland-foundations'

export type RankSlug =
  | 'initiate'
  | 'campfire-cadet'
  | 'scope-ranger'
  | 'stack-adept'
  | 'async-apprentice'
  | 'runtime-navigator'
  | 'flux-architect'
  | 'loop-sage'

export const BOOK1_RANKS: RankDefinition[] = [
  {
    slug: 'initiate',
    level: 1,
    title: 'Initiate',
    description: 'You completed the Prologue Trial and can read simple code and declare variables.',
    gemPath: '/brand/ranks/initiate.png',
    accent: '#7DD3FC',
    xpMin: 0,
    bossExam: null,
  },
  {
    slug: 'campfire-cadet',
    level: 2,
    title: 'Campfire Cadet',
    description: 'You can explain let/const/types basics and avoid common beginner mistakes.',
    gemPath: '/brand/ranks/campfire-cadet.png',
    accent: '#FDBA74',
    xpMin: 600,
    progressReq: {
      requiredTopicSlugs: ['variables-let-var', 'constants-const', 'data-types-overview'],
    },
    bossExam: {
      questionCount: 10,
      allowedTipCount: 2,
      allowedDocRevealCount: 0,
      masteryMinHalfSteps: 8,
      difficultyMix: { basic: 0.6, medium: 0.3, advanced: 0.1 },
      phases: 'boss',
    },
  },
  {
    slug: 'scope-ranger',
    level: 3,
    title: 'Scope Ranger',
    description: 'You predict what variables are visible where (global/function/block).',
    gemPath: '/brand/ranks/scope-ranger.png',
    accent: '#A7F3D0',
    xpMin: 1500,
    progressReq: {
      requiredTopicSlugs: ['scope'],
    },
    lockedByContent: false,
  },
  {
    slug: 'stack-adept',
    level: 4,
    title: 'Stack Adept',
    description: 'You understand functions, objects, and arrays and can debug using traces.',
    gemPath: '/brand/ranks/stack-adept.png',
    accent: '#F9A8D4',
    xpMin: 3000,
    progressReq: {
      requiredTopicSlugs: ['functions', 'objects-complex-type', 'arrays'],
    },
    lockedByContent: false,
  },
  {
    slug: 'async-apprentice',
    level: 5,
    title: 'Async Apprentice',
    description: 'You understand Promises/async-await at a practical level and basic timing.',
    gemPath: '/brand/ranks/async-apprentice.png',
    accent: '#FDE68A',
    xpMin: 5000,
    progressReq: {
      requiredTopicSlugs: ['promises', 'async-await'],
    },
    lockedByContent: false,
  },
  {
    slug: 'runtime-navigator',
    level: 6,
    title: 'Runtime Navigator',
    description: 'You can navigate runtimes (Browser vs Node) and explain what runtimes provide.',
    gemPath: '/brand/ranks/runtime-navigator.png',
    accent: '#A5B4FC',
    xpMin: 8000,
    progressReq: {
      requiredTopicSlugs: ['browser-ship-trial'],
    },
    lockedByContent: true,
  },
  {
    slug: 'flux-architect',
    level: 7,
    title: 'Flux Architect',
    description: 'You build clean solutions and apply patterns with confidence.',
    gemPath: '/brand/ranks/flux-architect.png',
    accent: '#C4B5FD',
    xpMin: 12000,
    progressReq: {
      requiredTopicSlugs: ['programming-browser-trial'],
    },
    lockedByContent: true,
  },
  {
    slug: 'loop-sage',
    level: 8,
    title: 'Loop Sage',
    description: 'You deeply understand execution order and async behavior; you can explain why code runs in that order.',
    gemPath: '/brand/ranks/loop-sage.png',
    accent: '#FCA5A5',
    xpMin: 18000,
    progressReq: {
      requiredTopicSlugs: ['book2-final-trial'],
    },
    lockedByContent: true,
  },
]
