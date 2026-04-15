export default function Loading() {
  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-20 rounded-lg bg-white/10" />
        <div className="h-9 w-24 rounded-xl bg-white/10" />
      </div>
      <div className="h-10 w-full rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4" />
      <div className="h-8 w-28 rounded-lg bg-white/[0.06] mb-4" />
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="w-16 h-16 rounded-lg bg-white/[0.06] flex-shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-1/2 rounded bg-white/[0.06]" />
              <div className="h-3 w-1/4 rounded bg-white/[0.04]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
