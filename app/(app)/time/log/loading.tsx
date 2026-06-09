function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line-1/60 ${className}`} />
}

export default function TimeLogLoading() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <div>
        <SkeletonBlock className="h-9 max-w-[200px]" />
        <SkeletonBlock className="mt-2 h-4 max-w-[280px]" />
      </div>
      <SkeletonBlock className="h-10 max-w-[320px] rounded-full" />
      <SkeletonBlock className="h-11 max-w-[480px] rounded-full" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton placeholders are static
          <SkeletonBlock key={i} className="h-16" />
        ))}
      </div>
    </div>
  )
}
