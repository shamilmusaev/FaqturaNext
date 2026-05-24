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
        'rounded-[24px] p-6 flex flex-col gap-3 min-h-[152px]',
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
          'tnum tracking-tight',
          isHero ? 'text-5xl font-semibold' : 'text-3xl font-semibold',
        )}
      >
        {value}
      </div>
      {hint && (
        <div className={cn('text-sm', isHero ? 'text-white/80' : 'text-ink/60')}>{hint}</div>
      )}
    </div>
  )
}
