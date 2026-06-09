import { ArrowUpRight } from '@/components/ui/icons'
import { cn } from '@/lib/cn'

interface Props {
  label: string
  value: string
  unit?: string
  hint?: string
  hero?: boolean
}

/**
 * KPI card in the reference dashboard style: label + arrow chip top row, a big
 * tabular-figure value with an optional unit, and a muted hint underneath.
 * The hero variant fills with brand orange.
 */
export function TimeStatCard({ label, value, unit, hint, hero }: Props) {
  return (
    <div
      className={cn(
        'rounded-[24px] p-6 flex min-h-[150px] flex-col gap-4 overflow-hidden',
        hero ? 'bg-brand text-white' : 'bg-card border border-line-1',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={cn('text-sm font-medium', hero ? 'text-white/80' : 'text-ink/60')}>
          {label}
        </span>
        <span
          className={cn(
            'h-8 w-8 inline-flex items-center justify-center rounded-full shrink-0',
            hero ? 'bg-white/20 text-white' : 'border border-line-1 text-ink/60',
          )}
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-auto">
        <div className="flex items-baseline gap-1.5 tnum leading-none tracking-tight">
          <span className="text-[clamp(2rem,2.6vw,2.75rem)] font-semibold">{value}</span>
          {unit && (
            <span className={cn('text-lg font-medium', hero ? 'text-white/70' : 'text-ink/40')}>
              {unit}
            </span>
          )}
        </div>
        {hint && (
          <p className={cn('mt-2 text-sm', hero ? 'text-white/80' : 'text-ink/50')}>{hint}</p>
        )}
      </div>
    </div>
  )
}
