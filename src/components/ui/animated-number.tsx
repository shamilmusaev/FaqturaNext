'use client'

import { type Currency, formatMoney } from '@/lib/money'
import { animate, motion, useMotionValue, useTransform } from 'motion/react'
import { useEffect } from 'react'

interface BaseProps {
  /** Animation duration in seconds. */
  duration?: number
  /** Delay before starting, in seconds. Useful for staggering several cards. */
  delay?: number
}

interface AnimatedNumberProps extends BaseProps {
  value: number
  /** Custom formatter — receives the current animated value (float). */
  format?: (v: number) => string
  /** Number of decimals to show when no `format` is provided. */
  decimals?: number
}

/**
 * Counts up from 0 to `value` once when mounted (and whenever `value` changes).
 * Uses an ease-out-quint curve so the number races in then settles.
 */
export function AnimatedNumber({
  value,
  format,
  decimals = 0,
  duration = 2.2,
  delay = 0,
}: AnimatedNumberProps) {
  const mv = useMotionValue(0)
  const display = useTransform(mv, (v) => (format ? format(v) : v.toFixed(decimals)))

  useEffect(() => {
    const controls = animate(mv, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
    })
    return () => controls.stop()
  }, [value, duration, delay, mv])

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="inline-block origin-left"
    >
      {display}
    </motion.span>
  )
}

interface AnimatedMoneyProps extends BaseProps {
  /** Cents as a plain number. Convert BigInt → Number on the server. */
  cents: number
  currency?: Currency
  locale?: string
}

/**
 * Same as AnimatedNumber, but formats the running value as currency.
 * Round the animated value to whole cents before formatting so the
 * decimals stay stable (no float-drift in the last digit).
 */
export function AnimatedMoney({
  cents,
  currency = 'SEK',
  locale,
  duration = 1.1,
  delay = 0,
}: AnimatedMoneyProps) {
  return (
    <AnimatedNumber
      value={cents}
      duration={duration}
      delay={delay}
      format={(v) => formatMoney(Math.round(v), currency, locale)}
    />
  )
}
