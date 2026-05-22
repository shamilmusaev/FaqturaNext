import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean
  children: ReactNode
}

export function Card({ elevated, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-line-1 rounded-[24px] p-6',
        elevated && 'shadow-[var(--shadow-card)]',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
