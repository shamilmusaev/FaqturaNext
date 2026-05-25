function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-line-1/60 ${className}`} />
}

export default function InvoiceDetailLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-3xl" aria-hidden="true">
      <SkeletonBlock className="h-4 w-16" />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="mt-2 h-9 w-56" />
        </div>
        <SkeletonBlock className="h-9 w-32" />
      </div>
      <SkeletonBlock className="h-32" />
      <SkeletonBlock className="h-56" />
      <SkeletonBlock className="h-32 md:max-w-sm md:ml-auto" />
    </div>
  )
}
