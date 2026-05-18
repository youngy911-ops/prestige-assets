interface ExtractionFailureStateProps {
  assetId: string
  onRetry: () => void
}

export function ExtractionFailureState({ assetId, onRetry }: ExtractionFailureStateProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 p-4">
        <p className="text-sm font-semibold text-white">Extraction didn't complete</p>
        <p className="text-sm text-white/65 mt-1">
          This happens occasionally. Try again — it usually works on the second attempt.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center justify-center w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[15px] transition-all shadow-[0_0_0_1px_rgba(52,211,153,0.3),0_4px_16px_rgba(52,211,153,0.15)] hover:shadow-[0_0_0_1px_rgba(52,211,153,0.5),0_8px_24px_rgba(52,211,153,0.25)]"
        >
          Try Again →
        </button>
        <a
          href={`/assets/${assetId}/review`}
          className="text-sm text-white/65 hover:text-white text-center"
        >
          Skip to Manual Entry
        </a>
      </div>
    </div>
  )
}
