import { requireUser } from '@/lib/auth'

export default async function SettingsPage() {
  const { email, organizationId, role } = await requireUser()
  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <dl className="mt-6 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-ink/60">Email</dt>
        <dd>{email}</dd>
        <dt className="text-ink/60">Organization</dt>
        <dd className="font-mono">{organizationId}</dd>
        <dt className="text-ink/60">Role</dt>
        <dd>{role}</dd>
      </dl>
    </div>
  )
}
