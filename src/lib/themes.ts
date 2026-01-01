export type ThemeTokens = {
  accent?: string
  backgroundImage?: string
  card?: { bg?: string }
}

export function resolveTheme(bookTheme?: ThemeTokens | null, chapterTheme?: ThemeTokens | null) {
  return {
    accent: chapterTheme?.accent ?? bookTheme?.accent ?? '#38bdf8',
    backgroundImage: chapterTheme?.backgroundImage ?? bookTheme?.backgroundImage ?? null,
    card: {
      bg: chapterTheme?.card?.bg ?? bookTheme?.card?.bg ?? 'rgba(15, 23, 42, 0.65)',
    },
  }
}
