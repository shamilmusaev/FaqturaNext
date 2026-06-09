import { cn } from '@/lib/cn'
import { formatHM } from '../duration'

interface Props {
  title: string
  caption: string
  emptyLabel: string
  usedLabel: string
  leftLabel: string
  overLabel: string
  usedMinutes: number
  estimateMinutes: number
}

const RADIUS = 80
const CIRC = 2 * Math.PI * RADIUS
const SWEEP = 0.75 // 270° gauge, open at the bottom

/**
 * Estimate-vs-actual as a 270° gauge (reference "Project Progress"). The arc
 * fills with brand orange as budget is used, turns red once over. Legend below
 * shows used vs left (or over).
 */
export function GaugeProgress({
  title,
  caption,
  emptyLabel,
  usedLabel,
  leftLabel,
  overLabel,
  usedMinutes,
  estimateMinutes,
}: Props) {
  const hasBudget = estimateMinutes > 0
  const ratio = hasBudget ? usedMinutes / estimateMinutes : 0
  const pct = Math.round(ratio * 100)
  const over = hasBudget && usedMinutes > estimateMinutes
  const leftMinutes = Math.max(0, estimateMinutes - usedMinutes)
  const overMinutes = Math.max(0, usedMinutes - estimateMinutes)
  const fill = Math.min(ratio, 1) * SWEEP * CIRC
  const track = SWEEP * CIRC
  const gradId = over ? 'gaugeNeg' : 'gaugeBrand'

  return (
    <div className="bg-card border border-line-1 rounded-[24px] p-6 flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {hasBudget ? (
        <>
          <div className="relative mx-auto h-[180px] w-[220px]">
            <svg viewBox="0 0 200 200" className="h-full w-full">
              <title>{title}</title>
              <defs>
                <linearGradient id="gaugeBrand" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#f2774a" />
                  <stop offset="100%" stopColor="#e0531f" />
                </linearGradient>
                <linearGradient id="gaugeNeg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#d9533f" />
                  <stop offset="100%" stopColor="#b43a2c" />
                </linearGradient>
              </defs>
              <g transform="rotate(135 100 100)">
                <circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  stroke="var(--paper-2)"
                  strokeWidth="26"
                  strokeLinecap="round"
                  strokeDasharray={`${track} ${CIRC}`}
                />
                <circle
                  cx="100"
                  cy="100"
                  r={RADIUS}
                  fill="none"
                  stroke={`url(#${gradId})`}
                  strokeWidth="26"
                  strokeLinecap="round"
                  strokeDasharray={`${fill} ${CIRC}`}
                />
              </g>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="tnum text-5xl font-semibold tracking-tight">{pct}%</span>
              <span className={cn('text-sm', over ? 'text-neg' : 'text-ink/50')}>{caption}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-5 text-sm">
            <LegendItem color="var(--brand)" label={usedLabel} value={formatHM(usedMinutes)} />
            {over ? (
              <LegendItem
                color="var(--neg)"
                label={overLabel}
                value={formatHM(overMinutes)}
                danger
              />
            ) : (
              <LegendItem color="var(--paper-2)" label={leftLabel} value={formatHM(leftMinutes)} />
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-ink/50">{emptyLabel}</p>
      )}
    </div>
  )
}

function LegendItem({
  color,
  label,
  value,
  danger,
}: {
  color: string
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-ink/60">{label}</span>
      <span className={cn('tnum font-medium', danger ? 'text-neg' : 'text-ink')}>{value}</span>
    </span>
  )
}
