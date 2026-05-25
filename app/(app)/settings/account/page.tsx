import { AccountForm } from '@/features/settings/components/account-form'
import { requireUser } from '@/lib/auth'

export default async function SettingsAccountPage() {
  // requireUser is React-cached per request and already runs in the (app)
  // layout — reuse it instead of issuing another auth.getUser() round-trip.
  const { email, displayName: storedName } = await requireUser()
  const displayName = storedName || emailToDisplayName(email)
  const hasStoredName = Boolean(storedName)

  return <AccountForm email={email} displayName={displayName} hasStoredName={hasStoredName} />
}

function emailToDisplayName(email: string): string {
  const local = email.split('@')[0] ?? ''
  const cleaned = local.replace(/[._-]+/g, ' ').trim()
  if (!cleaned) return ''
  return cleaned
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}
