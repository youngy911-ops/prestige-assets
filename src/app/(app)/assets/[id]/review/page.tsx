import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ReviewPageClient } from '@/components/asset/ReviewPageClient'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import type { AssetType } from '@/lib/schema-registry/types'

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, extraction_result, inspection_notes, fields, checklist_state')
    .eq('id', assetId)
    .single()

  if (!asset) redirect('/assets/new')

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/assets/${assetId}/extract`}
          className="text-white/65 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">Review Extracted Data</h1>
          <p className="text-sm text-white/65 capitalize">
            {asset.asset_subtype
              ? `${asset.asset_type} — ${asset.asset_subtype}`
              : asset.asset_type}
          </p>
        </div>
      </div>

      <ReviewPageClient
        assetId={assetId}
        assetType={asset.asset_type as AssetType}
        extractionResult={asset.extraction_result as ExtractionResult | null}
        savedFields={(asset.fields as Record<string, string>) ?? {}}
        savedChecklistState={(asset.checklist_state as Record<string, string>) ?? {}}
        inspectionNotes={asset.inspection_notes}
      />
    </div>
  )
}
