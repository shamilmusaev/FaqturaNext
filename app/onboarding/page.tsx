import { redirect } from 'next/navigation'
import type { Route } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { OnboardingForm } from '@/features/auth/onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login' as Route)

  const { data: memberships } = await supabase.from('memberships').select('organization_id').limit(1)
  if (memberships && memberships.length > 0) redirect('/overview' as Route)

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm"><OnboardingForm /></div>
    </div>
  )
}
