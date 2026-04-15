export default function Loading() {
  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-5 h-5 rounded bg-white/10" />
        <div className="space-y-1.5">
          <div className="h-6 w-28 rounded-lg bg-white/10" />
          <div className="h-4 w-48 rounded bg-white/[0.06]" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl border border-white/[0.06] bg-white/[0.03]" />
        ))}
      </div>
    </div>
  )
}
