import type { ReactNode } from 'react'
import { AppShell } from '@/components/chrome/app-shell'
import { requireUser } from '@/lib/auth'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { email } = await requireUser()
  return <AppShell userEmail={email}>{children}</AppShell>
}
