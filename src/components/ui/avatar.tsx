import { cn } from '@/lib/cn'

const TINTS = [
  '#D9CDB0',
  '#E8C8B3',
  '#C8D6B3',
  '#B3C5D9',
  '#D9B3C8',
  '#C0B8D9',
  '#D9D2B0',
  '#B0D9C8',
  '#E0C0B0',
  '#B0C0E0',
]

function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  if (!first) return '?'
  if (parts.length === 1) return first.charAt(0).toUpperCase()
  const last = parts[parts.length - 1] ?? first
  return (first.charAt(0) + last.charAt(0)).toUpperCase()
}

interface Props {
  name: string
  className?: string
  /** When true (default) pick a per-name tint. Pass `false` for neutral. */
  tinted?: boolean
}

export function Avatar({ name, className, tinted = true }: Props) {
  const tint = tinted ? TINTS[hashCode(name) % TINTS.length] : undefined
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-full text-ink text-sm font-medium',
        !tinted && 'bg-line-1',
        className,
      )}
      style={tinted && tint ? { background: tint } : undefined}
      aria-label={name}
    >
      {initials(name)}
    </span>
  )
}
