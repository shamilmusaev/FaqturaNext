import type { ReactNode } from 'react'
import { AppShell } from '@/components/chrome/app-shell'

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell userEmail="signed-out@local">{children}</AppShell>
}
