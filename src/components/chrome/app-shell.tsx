import type { ReactNode } from 'react'
import { BottomTabs } from './bottom-tabs'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'

export function AppShell({
  userEmail,
  userName,
  children,
}: {
  userEmail: string
  userName?: string | null
  children: ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userEmail={userEmail} userName={userName} />
        <main className="flex-1 px-4 pt-4 pb-20 md:px-8 md:pt-5 md:pb-8">
          <div className="w-full max-w-[1568px]">{children}</div>
        </main>
      </div>
      <BottomTabs />
    </div>
  )
}
