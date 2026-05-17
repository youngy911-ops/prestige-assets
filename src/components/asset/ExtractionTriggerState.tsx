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
          Upload photos first to auto-extract details. Or skip to manual entry.
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
        type="button"
        onClick={onTrigger}
        className="flex items-center justify-center w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-[15px] transition-all shadow-[0_0_0_1px_rgba(52,211,153,0.3),0_4px_16px_rgba(52,211,153,0.15)] hover:shadow-[0_0_0_1px_rgba(52,211,153,0.5),0_8px_24px_rgba(52,211,153,0.25)]"
      >
        Extract Details from Photos
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
