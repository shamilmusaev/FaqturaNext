function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line-1/60 ${className}`} />
}

export default function ClientsLoading() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-[260px] flex-1">
          <SkeletonBlock className="h-9 max-w-[200px]" />
          <SkeletonBlock className="mt-2 h-4 max-w-[280px]" />
        </div>
        <SkeletonBlock className="h-11 w-32 rounded-full" />
      </div>
      <SkeletonBlock className="h-11 max-w-[420px]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders are static
          <SkeletonBlock key={i} className="h-44" />
        ))}
      </div>
    </div>
  )
}
