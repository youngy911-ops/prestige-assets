export default function Loading() {
  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-20 animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-5 h-5 rounded bg-white/10" />
        <div className="h-6 w-40 rounded bg-white/10" />
      </div>
      <div className="h-2 w-full rounded-full bg-white/10 mb-8" />
      <div className="grid grid-cols-3 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-white/[0.06]" />
        ))}
      </div>
    </div>
  )
}
