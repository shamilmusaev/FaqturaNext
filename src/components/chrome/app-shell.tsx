import type { ReactNode } from 'react'
import { Sidebar } from './sidebar'
import { TopBar } from './topbar'
import { BottomTabs } from './bottom-tabs'

export function AppShell({ userEmail, children }: { userEmail: string; children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userEmail={userEmail} />
        <main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main>
      </div>
      <BottomTabs />
    </div>
  )
}
