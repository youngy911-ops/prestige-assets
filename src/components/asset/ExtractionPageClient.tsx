'use client'
import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  autoStart?: boolean
}

export function ExtractionPageClient({
  assetId,
  assetType,
  initialExtractionResult,
  inspectionNotes,
  hasPhotos,
  autoStart = false,
}: ExtractionPageClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState<ExtractionStatus>(
    initialExtractionResult ? 'success' : 'idle'
  )
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(
    initialExtractionResult
  )

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

      // Auto-navigate to review when extraction was auto-started (from photos page CTA)
      if (autoStart) {
        router.push(`/assets/${assetId}/review`)
      }
    } catch {
      setStatus('failure')
    }
  }, [assetId, autoStart, router])

  useEffect(() => {
    if (autoStart && status === 'idle' && hasPhotos) {
      triggerExtraction()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {status !== 'success' && (
        <InspectionNotesSection
          assetId={assetId}
          assetType={assetType}
          initialNotes={inspectionNotes}
        />
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
