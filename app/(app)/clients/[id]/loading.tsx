function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line-1/60 ${className}`} />
}

export default function ClientDetailLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl" aria-hidden="true">
      <SkeletonBlock className="h-4 w-16" />
      <div className="flex items-start justify-between gap-4">
        <SkeletonBlock className="h-9 w-64" />
        <SkeletonBlock className="h-9 w-24" />
      </div>
      <div className="flex flex-col gap-2">
        <SkeletonBlock className="h-4 max-w-[220px]" />
        <SkeletonBlock className="h-4 max-w-[260px]" />
        <SkeletonBlock className="h-4 max-w-[180px]" />
      </div>
    </div>
  )
}
