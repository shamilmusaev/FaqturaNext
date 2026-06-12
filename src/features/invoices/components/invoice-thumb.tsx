'use client'

import { cn } from '@/lib/cn'
import { useState } from 'react'

/** Lazy invoice thumbnail with a pulsing skeleton and a graceful error fallback. */
export function InvoiceThumb({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="relative h-full w-full bg-paper">
      {!loaded && !error && <div className="absolute inset-0 animate-pulse bg-line-1/50" />}
      {error ? (
        <div className="flex h-full w-full items-center justify-center text-[11px] uppercase tracking-wider text-ink/35">
          PDF
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            'h-full w-full object-cover object-top transition-opacity duration-300',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
      )}
    </div>
  )
}
