import type { Route } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="h-16 px-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-semibold">
          Faqtura
        </Link>
        <nav className="flex items-center gap-4">
          <Link href={'/login' as Route} className="text-sm">
            Sign in
          </Link>
          <Link
            href={'/signup' as Route}
            className="text-sm font-medium px-4 py-2 rounded-[12px] bg-ink text-white"
          >
            Create account
          </Link>
        </nav>
      </header>
      {children}
    </div>
  )
}
