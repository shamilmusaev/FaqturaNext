'use client'

import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/cn'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useActionState } from 'react'
import type { SettingsActionResult } from '../actions'

interface Props {
  action: (prev: SettingsActionResult, formData: FormData) => Promise<SettingsActionResult>
  readOnly?: boolean
  /** Optional i18n key for the success toast. Defaults to `settings.common.saved`. */
  successToastKey?: string
  /** Reset form fields after a successful submit (e.g. password change). */
  resetOnSuccess?: boolean
  children: (helpers: {
    err: (key: string) => string | undefined
    pending: boolean
    readOnly: boolean
  }) => React.ReactNode
}

const initialState: SettingsActionResult = {}

export function SettingsForm({
  action,
  readOnly = false,
  successToastKey = 'settings.common.saved',
  resetOnSuccess = false,
  children,
}: Props) {
  const tCommon = useTranslations('settings.common')
  const tToast = useTranslations()
  const [state, dispatch, pending] = useActionState(action, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [dirty, setDirty] = useState(false)
  const lastOkRef = useRef(0)

  useEffect(() => {
    if (state.ok) {
      const now = Date.now()
      if (now - lastOkRef.current > 200) {
        lastOkRef.current = now
        toast.success(tToast(successToastKey))
        setDirty(false)
        if (resetOnSuccess) formRef.current?.reset()
      }
    }
  }, [state, tToast, successToastKey, resetOnSuccess])

  const err = (key: string) => state.fieldErrors?.[key]

  return (
    <form
      ref={formRef}
      action={dispatch}
      onChange={() => setDirty(true)}
      onReset={() => setDirty(false)}
      className="flex flex-col gap-6"
    >
      <fieldset disabled={readOnly} className="contents">
        {children({ err, pending, readOnly })}
      </fieldset>

      {state.error && (
        <p className="rounded-2xl border border-neg/30 bg-neg/5 px-4 py-3 text-sm text-neg">
          {state.error}
        </p>
      )}

      <SaveBar
        visible={dirty && !readOnly}
        pending={pending}
        onCancel={() => {
          formRef.current?.reset()
          setDirty(false)
        }}
        label={tCommon('save')}
        savingLabel={tCommon('saving')}
        cancelLabel={tCommon('cancel')}
      />
    </form>
  )
}

function SaveBar({
  visible,
  pending,
  onCancel,
  label,
  savingLabel,
  cancelLabel,
}: {
  visible: boolean
  pending: boolean
  onCancel: () => void
  label: string
  savingLabel: string
  cancelLabel: string
}) {
  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-20 transition-all duration-200',
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-3 pointer-events-none',
      )}
    >
      <div className="flex items-center gap-3 rounded-full bg-ink text-white pl-5 pr-1.5 py-1.5 shadow-pop">
        <span className="text-sm text-white/70">Unsaved changes</span>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-3.5 rounded-full text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          {cancelLabel}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="h-9 px-4 rounded-full text-sm font-medium bg-brand text-brand-ink hover:bg-brand-2 transition-colors disabled:opacity-60"
        >
          {pending ? savingLabel : label}
        </button>
      </div>
    </div>
  )
}
