import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

interface Props {
  label: string
  value: ReactNode
  hint?: ReactNode
  trailing?: ReactNode
  variant?: 'default' | 'hero'
  className?: string
}

export function StatCard({ label, value, hint, trailing, variant = 'default', className }: Props) {
  const isHero = variant === 'hero'
  return (
    <div
      className={cn(
        'rounded-[24px] p-6 flex min-w-0 flex-col gap-3 overflow-hidden min-h-[140px]',
        isHero ? 'bg-brand text-white' : 'bg-card border border-line-1',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={cn('text-sm font-medium', isHero ? 'text-white/80' : 'text-ink/60')}>
          {label}
        </span>
        {trailing}
      </div>
      <div
        className={cn(
          'tnum max-w-full overflow-hidden text-ellipsis whitespace-nowrap tracking-tight leading-none',
          isHero
            ? 'text-[clamp(2.75rem,3.2vw,3.5rem)] font-semibold'
            : 'text-[clamp(2rem,2.3vw,2.5rem)] font-semibold',
        )}
      >
        {value}
      </div>
      {hint && (
        <div className={cn('text-sm mt-auto', isHero ? 'text-white/80' : 'text-ink/60')}>
          {hint}
        </div>
      )}
    </div>
  )
}
