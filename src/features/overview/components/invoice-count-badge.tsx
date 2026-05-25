'use client'

import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

interface Props {
  count: number
  /** Stops the dot pulse when count is zero (nothing to draw attention to). */
  pulse?: boolean
}

/**
 * Animated invoice-count chip for the Outstanding hero card.
 * - Counts up from 0 to `count` on mount (spring-eased).
 * - A small dot beside the number gently pulses to signal "live".
 */
export function InvoiceCountBadge({ count, pulse = true }: Props) {
  const t = useTranslations('overview.metrics')
  const value = useMotionValue(0)
  const rounded = useTransform(value, (v) => Math.round(v))
  // Format the singular/plural label around the animated number.
  // We render the label parts statically; the count itself comes from `rounded`.
  const sample = t('invoiceCount', { count })
  // Split the localized string on the digit run so we keep "invoices"/"fakturor".
  const match = sample.match(/^(\D*)(\d+)(.*)$/)
  const before = match?.[1] ?? ''
  const after = match?.[3] ?? ` ${sample}`

  useEffect(() => {
    const controls = animate(value, count, {
      duration: 2.0,
      ease: [0.22, 1, 0.36, 1], // ease-out-quint, feels snappy then settles
    })
    return () => controls.stop()
  }, [count, value])

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.85, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      className="inline-flex items-center gap-1.5 rounded-full bg-ink/30 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
    >
      {pulse && count > 0 && (
        <span className="relative inline-flex h-1.5 w-1.5">
          <motion.span
            className="absolute inset-0 rounded-full bg-white/70"
            animate={{ scale: [1, 2.4, 2.4], opacity: [0.55, 0, 0] }}
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeOut' }}
          />
          <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-white" />
        </span>
      )}
      <span>
        {before}
        <motion.span>{rounded}</motion.span>
        {after}
      </span>
    </motion.span>
  )
}
