export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-20 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-5 rounded bg-white/10" />
        <div className="h-6 w-32 rounded bg-white/10" />
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 mb-8" />
      <div className="flex flex-col gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.04] border border-white/[0.06]" />
        ))}
      </div>
    </div>
  )
}
