'use client'

import { useState } from 'react'

/** Lazy invoice thumbnail with a pulsing skeleton and a graceful error fallback. */
export function InvoiceThumb({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="relative h-full w-full bg-paper">
      {/* Skeleton sits behind the image (not gating its opacity) so the thumbnail
          still shows even if a cached image's onLoad never fires. */}
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
          className="relative h-full w-full object-cover object-top"
        />
      )}
    </div>
  )
}
