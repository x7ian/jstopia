'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/books', label: 'Books' },
  { href: '/admin/chapters', label: 'Chapters' },
  { href: '/admin/topics', label: 'Lessons' },
  { href: '/admin/docs', label: 'Docs' },
  { href: '/admin/questions', label: 'Questions' },
]

function isActive(pathname: string, href: string) {
  if (href === '/admin') return pathname === '/admin'
  return pathname.startsWith(href)
}

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="mt-4 flex flex-wrap gap-2 text-sm">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'rounded-full px-3 py-1 transition-colors',
              active
                ? 'bg-slate-900 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
            ].join(' ')}
            aria-current={active ? 'page' : undefined}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
