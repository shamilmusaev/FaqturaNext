import { cn } from '@/lib/cn'

interface Props {
  /** Filled amount and the budget it's measured against (same unit). */
  value: number
  max: number | null
  className?: string
}

/**
 * Token-based progress bar. Green while within budget, red (and clamped to a
 * full bar) once over. Renders nothing meaningful when there's no budget set.
 */
export function ProgressBar({ value, max, className }: Props) {
  const hasBudget = max != null && max > 0
  const ratio = hasBudget ? value / max : 0
  const pct = Math.min(100, Math.round(ratio * 100))
  const over = hasBudget && value > max

  return (
    <div className={cn('h-4 w-full overflow-hidden rounded-full bg-paper-2', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-[width]',
          over ? 'bg-[image:var(--grad-neg)]' : 'bg-[image:var(--grad-pos)]',
        )}
        style={{ width: `${hasBudget ? Math.max(pct, 4) : 0}%` }}
      />
    </div>
  )
}
