import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'

type Tone = 'neutral' | 'pos' | 'warn' | 'neg' | 'brand' | 'info'

const tones: Record<Tone, { wrap: string; dot: string }> = {
  neutral: { wrap: 'bg-paper-2 text-ink-2', dot: 'bg-ink-3' },
  pos: { wrap: 'bg-pos-bg text-pos', dot: 'bg-pos' },
  warn: { wrap: 'bg-warn-bg text-warn', dot: 'bg-warn' },
  neg: { wrap: 'bg-neg-bg text-neg', dot: 'bg-neg' },
  brand: { wrap: 'bg-brand/10 text-brand', dot: 'bg-brand' },
  info: { wrap: 'bg-info-bg text-info', dot: 'bg-info' },
}

export function Chip({
  children,
  tone = 'neutral',
  className,
  showDot = true,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
  showDot?: boolean
}) {
  const t = tones[tone]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        t.wrap,
        className,
      )}
    >
      {showDot && <span className={cn('h-1.5 w-1.5 rounded-full', t.dot)} />}
      {children}
    </span>
  )
}
