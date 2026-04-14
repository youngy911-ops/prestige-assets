export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-20 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-5 h-5 rounded bg-white/10" />
        <div className="h-6 w-40 rounded bg-white/10" />
      </div>
      {/* Photo strip skeleton */}
      <div className="grid grid-cols-4 gap-1.5 mb-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-white/[0.06]" />
        ))}
      </div>
      {/* Fields block skeleton */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 mb-4">
        <div className="h-4 w-32 rounded bg-white/10 mb-3" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-3 rounded bg-white/[0.06] mb-2" style={{ width: `${55 + (i % 4) * 10}%` }} />
        ))}
      </div>
      {/* Description block skeleton */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
        <div className="h-4 w-28 rounded bg-white/10 mb-3" />
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-3 rounded bg-white/[0.06] mb-2" style={{ width: `${60 + (i % 5) * 7}%` }} />
        ))}
      </div>
    </div>
  )
}
