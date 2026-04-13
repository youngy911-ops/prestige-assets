import { redirect } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExtractionPageClient } from '@/components/asset/ExtractionPageClient'
import type { ExtractionResult } from '@/lib/ai/extraction-schema'
import type { AssetType } from '@/lib/schema-registry/types'

interface ExtractPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ autostart?: string }>
}

export default async function ExtractPage({ params, searchParams }: ExtractPageProps) {
  const { id: assetId } = await params
  const { autostart } = await searchParams
  const autoStart = autostart === '1'
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, extraction_result, inspection_notes')
    .eq('id', assetId)
    .single()

  if (!asset) redirect('/assets/new')

  const { data: photos } = await supabase
    .from('asset_photos')
    .select('id')
    .eq('asset_id', assetId)

  const hasPhotos = (photos?.length ?? 0) > 0

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/assets/${assetId}/photos`}
          className="text-white/65 hover:text-white transition-colors p-1 -ml-1"
          aria-label="Back"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-white">AI Extraction</h1>
          <p className="text-sm text-white/65 capitalize">
            {asset.asset_subtype
              ? `${asset.asset_type} — ${asset.asset_subtype}`
              : asset.asset_type}
          </p>
        </div>
      </div>

      <ExtractionPageClient
        assetId={assetId}
        assetType={asset.asset_type as AssetType}
        initialExtractionResult={asset.extraction_result as ExtractionResult | null}
        inspectionNotes={asset.inspection_notes}
        hasPhotos={hasPhotos}
        autoStart={autoStart}
      />
    </div>
  )
}
