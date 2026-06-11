'use client'

import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { setOrgLogoAction } from '../actions'
import { SectionCard } from './section-card'

interface Props {
  orgId: string
  orgName: string
  logoUrl: string | null
  readOnly: boolean
}

const MAX_BYTES = 2 * 1024 * 1024 // 2 MB

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?'
  )
}

export function LogoUpload({ orgId, orgName, logoUrl, readOnly }: Props) {
  const t = useTranslations('settings.company.logo')
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [url, setUrl] = useState(logoUrl || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the same file
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) return setError(t('errType'))
    if (file.size > MAX_BYTES) return setError(t('errSize'))

    setBusy(true)
    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const path = `${orgId}/logo-${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('org-logos')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('org-logos').getPublicUrl(path)
      const res = await setOrgLogoAction(data.publicUrl)
      if (res.error) throw new Error(res.error)
      setUrl(data.publicUrl)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errUpload'))
    } finally {
      setBusy(false)
    }
  }

  const onRemove = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await setOrgLogoAction('')
      if (res.error) throw new Error(res.error)
      setUrl('')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errUpload'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard title={t('title')} subtitle={t('subtitle')}>
      <div className="flex items-center gap-5">
        {url ? (
          <div className="h-20 w-20 shrink-0 rounded-[16px] border border-line-1 bg-paper grid place-items-center overflow-hidden">
            <img src={url} alt="Logo" className="h-full w-full object-contain" />
          </div>
        ) : (
          // Default when no logo: orange rounded box with the org initials,
          // matching the fallback used on the invoice templates.
          <div className="h-20 w-20 shrink-0 rounded-[16px] bg-brand grid place-items-center">
            <span className="text-2xl font-semibold tracking-wide text-white">
              {initials(orgName)}
            </span>
          </div>
        )}

        {!readOnly && (
          <div className="flex flex-col gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={onPick}
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
              >
                {busy ? t('uploading') : t('upload')}
              </Button>
              {url && (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={busy}
                  className="text-sm text-ink/55 hover:text-neg transition-colors"
                >
                  {t('remove')}
                </button>
              )}
            </div>
            <span className="text-xs text-ink/45">{t('hint')}</span>
            {error && <span className="text-xs text-neg">{error}</span>}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
