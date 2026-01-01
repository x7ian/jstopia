import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { SiteHeader } from '@/components/SiteHeader'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Javascriptopia',
  description: 'Learn JavaScript by doing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        data-theme="space"
        className="min-h-screen text-[16.5px] leading-7 text-[color:var(--text)] antialiased sm:text-[17px] [font-family:var(--font-geist-sans),system-ui]"
      >
        <ThemeProvider>
          <div className="relative min-h-screen overflow-hidden bg-starfield">
            <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.2),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(167,139,250,0.2),_transparent_55%)] blur-3xl" />
            <div className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-[color:var(--bg-0)] via-[color:var(--bg-1)] to-[#0b1120]" />
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="relative z-10 flex flex-1 flex-col">{children}</main>
              <footer className="mx-auto mb-8 mt-12 w-full max-w-6xl px-6 text-xs text-[color:var(--muted)]">
                © {new Date().getFullYear()} Javascriptopia · Crafted for learning JavaScript with flow.
              </footer>
            </div>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
