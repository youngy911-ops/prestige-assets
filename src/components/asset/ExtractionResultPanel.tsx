'use client'
import { useRouter } from 'next/navigation'
import { ChevronRight } from 'lucide-react'
import { ConfidenceBadge } from '@/components/asset/ConfidenceBadge'
import { getFieldsSortedBySfOrder } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'

interface ExtractionResultPanelProps {
  assetId: string
  assetType: AssetType
  extractionResult: ExtractionResult
  onRerun: () => void
}

export function ExtractionResultPanel({
  assetId,
  assetType,
  extractionResult,
  onRerun,
}: ExtractionResultPanelProps) {
  const router = useRouter()
  const fields = getFieldsSortedBySfOrder(assetType)

  return (
    <div className="flex flex-col">
      {/* Field list */}
      <div className="flex flex-col">
        {fields.map((field, i) => {
          const extracted = extractionResult[field.key]
          const hasValue = extracted?.value != null
          const confidenceLevel: 'high' | 'medium' | 'low' | 'not_found' =
            extracted?.confidence ?? 'not_found'

          return (
            <div
              key={field.key}
              className={`flex items-center justify-between py-3 ${
                i < fields.length - 1 ? 'border-b border-white/10' : ''
              }`}
              style={{ gap: '8px' }}
            >
              <span className="text-sm text-white/65 flex-1 min-w-0 truncate">
                {field.label}
              </span>
              <span
                className={`text-sm flex-shrink-0 mx-2 ${
                  hasValue ? 'font-semibold text-white' : 'text-white/40'
                }`}
              >
                {hasValue ? extracted!.value : 'Not found'}
              </span>
              <ConfidenceBadge level={hasValue ? confidenceLevel : 'not_found'} />
            </div>
          )
        })}
      </div>

      {/* Sticky CTA */}
      <div className="sticky bottom-0 bg-[var(--background)] pt-3">
        <button
          onClick={() => router.push(`/assets/${assetId}/review`)}
          className="flex items-center justify-center w-full h-11 rounded-md bg-[oklch(0.29_0.07_248)] hover:bg-[oklch(0.29_0.07_248)]/90 text-white font-medium text-sm transition-colors gap-1"
        >
          Proceed to Review
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={onRerun}
          className="w-full text-sm text-white/65 hover:text-white text-center mt-2"
        >
          Re-run Extraction
        </button>
      </div>
    </div>
  )
}
