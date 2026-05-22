import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Tone = 'neutral' | 'pos' | 'warn' | 'neg' | 'brand'

const tones: Record<Tone, string> = {
  neutral: 'bg-line-1/50 text-ink border-line-1',
  pos: 'bg-pos/10 text-pos border-pos/30 pos',
  warn: 'bg-warn/10 text-warn border-warn/30 warn',
  neg: 'bg-neg/10 text-neg border-neg/30 neg',
  brand: 'bg-brand/10 text-brand border-brand/30 brand',
}

export function Chip({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border', tones[tone], className)}>
      {children}
    </span>
  )
}
