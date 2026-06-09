function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line-1/60 ${className}`} />
}

export default function TimeBudgetsLoading() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div>
        <SkeletonBlock className="h-9 max-w-[200px]" />
        <SkeletonBlock className="mt-2 h-4 max-w-[300px]" />
      </div>
      <SkeletonBlock className="h-10 max-w-[320px] rounded-full" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders are static
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
        <SkeletonBlock className="h-72" />
        <SkeletonBlock className="h-72" />
      </div>
    </div>
  )
}
