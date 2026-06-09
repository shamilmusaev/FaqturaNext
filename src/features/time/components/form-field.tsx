import type { ReactNode } from 'react'

// Shared styling for native <select> controls across the time-feature forms.
export const SELECT_CLASS =
  'h-11 w-full rounded-[12px] border border-line-1 bg-card px-3 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand'

// Labelled form field. `hint` is shown below the control unless an error is
// present (the error takes priority).
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: control is rendered via children
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="text-ink/80">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-ink/40">{hint}</span>}
      {error && <span className="text-xs text-neg">{error}</span>}
    </label>
  )
}
