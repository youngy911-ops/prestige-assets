import { Loader2 } from 'lucide-react'

export function ExtractionLoadingState() {
  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <Loader2 className="w-8 h-8 text-white/65 animate-spin" aria-hidden="true" />
      <div>
        <p className="text-white font-medium">Analysing photos and notes…</p>
        <p className="text-sm text-white/65 mt-1">
          This takes 5–30 seconds. You can navigate away — results will be waiting when you return.
        </p>
      </div>
    </div>
  )
}
