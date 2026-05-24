import type { ReactNode } from 'react'
import { BottomTabs } from './bottom-tabs'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'

export function AppShell({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userEmail={userEmail} />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
      <BottomTabs />
    </div>
  )
}
