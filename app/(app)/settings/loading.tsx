function Block({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line-1/60 ${className}`} />
}

function SectionSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <section className="rounded-[20px] border border-line-1 bg-card p-6 md:p-8 grid md:grid-cols-[280px_1fr] gap-6 md:gap-10">
      <div className="space-y-2.5">
        <Block className="h-4 w-32 rounded" />
        <Block className="h-3 w-48 rounded" />
      </div>
      <div className="flex flex-col gap-5 min-w-0">
        {Array.from({ length: rows }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          <div key={i} className="flex flex-col gap-1.5">
            <Block className="h-3 w-24 rounded" />
            <Block className="h-11 w-full" />
          </div>
        ))}
      </div>
    </section>
  )
}

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <SectionSkeleton rows={2} />
      <SectionSkeleton rows={3} />
    </div>
  )
}
