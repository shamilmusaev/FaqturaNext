import type { ReactNode } from 'react'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 px-6 flex items-center">
        <Link href="/" className="text-xl font-semibold">Faqtura</Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )
}
