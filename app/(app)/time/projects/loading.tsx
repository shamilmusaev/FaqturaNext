function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line-1/60 ${className}`} />
}

export default function TimeProjectsLoading() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div className="flex items-start justify-between gap-4">
        <SkeletonBlock className="h-9 max-w-[200px] flex-1" />
        <SkeletonBlock className="h-11 w-36 rounded-full" />
      </div>
      <SkeletonBlock className="h-10 max-w-[320px] rounded-full" />
      <SkeletonBlock className="h-9 max-w-[220px] rounded-full" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders are static
          <SkeletonBlock key={i} className="h-28" />
        ))}
      </div>
    </div>
  )
}
