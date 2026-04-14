'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { InspectionNotesSection } from '@/components/asset/InspectionNotesSection'
import { ExtractionTriggerState } from '@/components/asset/ExtractionTriggerState'
import { ExtractionLoadingState } from '@/components/asset/ExtractionLoadingState'
import { ExtractionResultPanel } from '@/components/asset/ExtractionResultPanel'
import { ExtractionFailureState } from '@/components/asset/ExtractionFailureState'
import type { AssetType } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

type ExtractionStatus = 'idle' | 'loading' | 'success' | 'failure'

interface ExtractionPageClientProps {
  assetId: string
  assetType: AssetType
  initialExtractionResult: ExtractionResult | null
  inspectionNotes: string | null
  hasPhotos: boolean
  photoUrls?: string[]   // signed URLs for quality check
  autoStart?: boolean
}

export function ExtractionPageClient({
  assetId,
  assetType,
  initialExtractionResult,
  inspectionNotes,
  hasPhotos,
  photoUrls = [],
  autoStart = false,
}: ExtractionPageClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState<ExtractionStatus>(
    initialExtractionResult ? 'success' : 'idle'
  )
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(
    initialExtractionResult
  )
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([])
  const [warningsDismissed, setWarningsDismissed] = useState(false)

  // Check photo quality on mount
  useEffect(() => {
    if (!hasPhotos || photoUrls.length === 0 || initialExtractionResult) return
    import('@/lib/utils/photoQuality').then(({ checkPhotoQuality }) => {
      Promise.all(photoUrls.slice(0, 5).map((url, i) =>
        checkPhotoQuality(url).then(w => w.map(warning => `Photo ${i + 1}: ${warning}`))
      )).then(results => {
        const all = results.flat()
        if (all.length > 0) setQualityWarnings(all)
      }).catch(() => {})
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const triggerExtraction = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      if (!res.ok) throw new Error('Extraction failed')
      const data = await res.json()
      setExtractionResult(data.extraction_result)
      setStatus('success')
    } catch {
      setStatus('failure')
    }
  }, [assetId, router])

  useEffect(() => {
    if (autoStart && status === 'idle' && hasPhotos) {
      triggerExtraction()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showWarnings = qualityWarnings.length > 0 && !warningsDismissed && status === 'idle'

  return (
    <div className="flex flex-col gap-6">
      {status !== 'success' && (
        <InspectionNotesSection
          assetId={assetId}
          assetType={assetType}
          initialNotes={inspectionNotes}
        />
      )}

      {/* Photo quality warnings */}
      {showWarnings && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-300">Photo quality warnings</p>
              <ul className="mt-1 space-y-0.5">
                {qualityWarnings.map((w, i) => (
                  <li key={i} className="text-xs text-amber-300/80">{w}</li>
                ))}
              </ul>
              <p className="text-xs text-white/45 mt-2">Better photos improve AI accuracy. You can retake them or proceed anyway.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href={`/assets/${assetId}/photos`}
              className="text-xs font-medium text-amber-300 border border-amber-500/30 rounded-lg px-3 py-1.5 hover:bg-amber-500/10 transition-colors"
            >
              Retake Photos
            </a>
            <button
              type="button"
              onClick={() => setWarningsDismissed(true)}
              className="text-xs text-white/45 hover:text-white/70 transition-colors px-2"
            >
              Proceed anyway
            </button>
          </div>
        </div>
      )}

      {status === 'idle' && (
        <ExtractionTriggerState
          assetId={assetId}
          hasPhotos={hasPhotos}
          onTrigger={triggerExtraction}
        />
      )}

      {status === 'loading' && <ExtractionLoadingState />}

      {status === 'success' && extractionResult && (
        <ExtractionResultPanel
          assetId={assetId}
          assetType={assetType}
          extractionResult={extractionResult}
          onRerun={triggerExtraction}
        />
      )}

      {status === 'failure' && (
        <ExtractionFailureState assetId={assetId} onRetry={triggerExtraction} />
      )}
    </div>
  )
}
