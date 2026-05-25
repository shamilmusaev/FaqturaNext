function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line-1/60 ${className}`} />
}

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-5" aria-hidden="true">
      <header className="flex items-end justify-between flex-wrap gap-4 px-2 pt-2 pb-5">
        <div className="min-w-[280px] flex-1">
          <SkeletonBlock className="h-12 max-w-[420px]" />
          <SkeletonBlock className="mt-3 h-4 max-w-[320px]" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-11 w-28 rounded-full" />
          <SkeletonBlock className="h-11 w-32 rounded-full" />
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
        <SkeletonBlock className="h-36" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <SkeletonBlock className="h-[320px]" />
        <SkeletonBlock className="h-[320px]" />
      </div>
    </div>
  )
}
