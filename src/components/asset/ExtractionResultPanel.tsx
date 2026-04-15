'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, ChevronDown } from 'lucide-react'
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
  const [showNotFound, setShowNotFound] = useState(false)

  const foundFields = fields.filter(f => extractionResult[f.key]?.value != null)
  const notFoundFields = fields.filter(f => extractionResult[f.key]?.value == null)

  return (
    <div className="flex flex-col">
      {/* Summary pill */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-white/65">
          <span className="font-semibold text-white">{foundFields.length}</span> of {fields.length} fields extracted
        </span>
        {foundFields.length > 0 && (
          <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
            {Math.round((foundFields.length / fields.length) * 100)}%
          </span>
        )}
      </div>

      {/* Found fields */}
      {foundFields.length > 0 && (
        <div className="flex flex-col divide-y divide-white/10 rounded-xl border border-white/[0.08] bg-white/[0.03] mb-4 overflow-hidden">
          {foundFields.map(field => {
            const extracted = extractionResult[field.key]!
            const confidence: 'high' | 'medium' | 'low' | 'not_found' = extracted.confidence ?? 'not_found'
            return (
              <div key={field.key} className="flex items-center justify-between px-4 py-3 gap-2">
                <span className="text-sm text-white/65 flex-1 min-w-0 truncate">{field.label}</span>
                <span className="text-sm font-semibold text-white flex-shrink-0 mx-2 max-w-[140px] truncate text-right">
                  {extracted.value}
                </span>
                <ConfidenceBadge level={confidence} />
              </div>
            )
          })}
        </div>
      )}

      {/* Not-found fields — collapsed by default */}
      {notFoundFields.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowNotFound(v => !v)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/65 transition-colors w-full text-left py-1"
          >
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showNotFound ? 'rotate-180' : ''}`} />
            {notFoundFields.length} field{notFoundFields.length !== 1 ? 's' : ''} not found
          </button>
          {showNotFound && (
            <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.02] mt-2 overflow-hidden">
              {notFoundFields.map(field => (
                <div key={field.key} className="flex items-center justify-between px-4 py-2.5 gap-2">
                  <span className="text-sm text-white/35 flex-1 min-w-0 truncate">{field.label}</span>
                  <span className="text-xs text-white/25 flex-shrink-0">Not found</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky CTA */}
      <div className="sticky bottom-0 bg-[var(--background)] pt-3 pb-1">
        <button
          type="button"
          onClick={() => router.push(`/assets/${assetId}/review`)}
          className="flex items-center justify-center w-full h-11 rounded-md bg-emerald-600 hover:bg-emerald-600/90 text-white font-medium text-sm transition-colors gap-1"
        >
          Proceed to Review
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRerun}
          className="w-full text-sm text-white/65 hover:text-white text-center mt-2 py-1"
        >
          Re-run Extraction
        </button>
      </div>
    </div>
  )
}
