'use client'

import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { UserMenu } from '@/components/UserMenu'

export function SiteHeader() {
  const pathname = usePathname()
  const hideNav = pathname === '/' || pathname === '/journey'

  return (
    <header className="site-header mx-auto mt-10 flex w-full max-w-6xl items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="glass rounded-full px-3 py-1 shadow-sm">
          <Image
            src="/brand/javascriptopia_logo_cropped.png"
            alt="Javascriptopia"
            width={120}
            height={48}
            priority
            className="h-7 w-auto"
          />
        </div>
        {!hideNav ? (
          <>
            <a
              href="/journey"
              className="btn-secondary rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.3em]"
            >
              Back to Journey
            </a>
            <a
              href="/about"
              className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
            >
              About
            </a>
            <a
              href="/mastering-the-flux"
              className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)] transition hover:text-[color:var(--text)]"
            >
              Mastering the Flux
            </a>
          </>
        ) : null}
      </div>
      <UserMenu />
    </header>
  )
}
