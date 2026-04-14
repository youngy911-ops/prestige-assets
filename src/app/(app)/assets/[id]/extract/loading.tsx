export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-20 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-5 rounded bg-white/10" />
        <div className="h-6 w-36 rounded bg-white/10" />
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 mb-8" />
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400/40" />
        <div className="h-4 w-48 rounded bg-white/10" />
      </div>
    </div>
  )
}
