import { cn } from '@/lib/cn'

interface Props {
  title: string
  subtitle?: string
  className?: string
  children: React.ReactNode
}

export function SectionCard({ title, subtitle, className, children }: Props) {
  return (
    <section
      className={cn(
        'rounded-[20px] border border-line-1 bg-card p-6 md:p-8',
        'grid md:grid-cols-[280px_1fr] gap-6 md:gap-10',
        className,
      )}
    >
      <header className="md:pt-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-ink/55 leading-relaxed">{subtitle}</p>}
      </header>
      <div className="flex flex-col gap-5 min-w-0">{children}</div>
    </section>
  )
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  optional?: boolean
  children: React.ReactNode
  className?: string
}

export function Field({ label, hint, error, optional, children, className }: FieldProps) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: control is rendered via children
    <label className={cn('flex flex-col gap-1.5 text-sm min-w-0', className)}>
      <span className="flex items-center justify-between text-ink/80">
        <span>{label}</span>
        {optional && <span className="text-[11px] uppercase tracking-wide text-ink/40">opt</span>}
      </span>
      {children}
      {hint && !error && <span className="text-xs text-ink/50">{hint}</span>}
      {error && <span className="text-xs text-neg">{error}</span>}
    </label>
  )
}
