interface ExtractionTriggerStateProps {
  assetId: string
  hasPhotos: boolean
  onTrigger: () => void
}

export function ExtractionTriggerState({ assetId, hasPhotos, onTrigger }: ExtractionTriggerStateProps) {
  if (!hasPhotos) {
    return (
      <div className="text-center py-8 flex flex-col items-center gap-3">
        <p className="text-white font-semibold">No photos uploaded</p>
        <p className="text-sm text-white/65">
          Upload photos first, then run AI extraction. Or skip to manual entry.
        </p>
        <a
          href={`/assets/${assetId}/review`}
          className="text-sm text-white/65 hover:text-white underline"
        >
          Skip to Manual Entry
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onTrigger}
        className="flex items-center justify-center w-full h-11 rounded-md bg-emerald-600 hover:bg-emerald-600/90 text-white font-medium text-sm transition-colors"
      >
        Run AI Extraction
      </button>
      <a
        href={`/assets/${assetId}/review`}
        className="text-sm text-white/65 hover:text-white text-center"
      >
        Skip to Manual Entry
      </a>
    </div>
  )
}
