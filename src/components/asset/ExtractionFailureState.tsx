interface ExtractionFailureStateProps {
  assetId: string
  onRetry: () => void
}

export function ExtractionFailureState({ assetId, onRetry }: ExtractionFailureStateProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border border-[var(--destructive)]/40 bg-[var(--destructive)]/10 p-4">
        <p className="text-sm font-semibold text-white">Extraction failed</p>
        <p className="text-sm text-white/65 mt-1">
          Could not connect to AI service. Check your connection and try again.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="flex items-center justify-center w-full h-11 rounded-md bg-emerald-600 hover:bg-emerald-600/90 text-white font-medium text-sm transition-colors"
        >
          Try Again
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
