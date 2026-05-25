import { AppShell } from '@/components/chrome/app-shell'
import { requireUser } from '@/lib/auth'
import type { ReactNode } from 'react'

export default async function AppLayout({
  children,
  modal,
}: {
  children: ReactNode
  modal: ReactNode
}) {
  const { email, displayName } = await requireUser()
  return (
    <AppShell userEmail={email} userName={displayName}>
      {children}
      {modal}
    </AppShell>
  )
}
