import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { generateFieldsBlock } from '@/lib/output/generateFieldsBlock'
import { OutputPanel } from '@/components/asset/OutputPanel'
import { StepIndicator } from '@/components/asset/StepIndicator'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

export default async function OutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, description')
    .eq('id', assetId)
    .single()

  if (!asset) redirect('/assets/new')

  // Compute fields block server-side — synchronous, always ready on page load
  const fieldsText = generateFieldsBlock(
    asset.asset_type as AssetType,
    (asset.fields ?? {}) as Record<string, string>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      {/* Header */}
      <div className="mb-4">
        <Link
          href={`/assets/${assetId}/review`}
          className="inline-flex items-center gap-1 text-sm text-white/65 hover:text-white mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Review
        </Link>
        <h1 className="text-xl font-semibold text-white">Output</h1>
        <p className="text-sm text-white/65 mt-0.5">
          {getAssetDisplayTitle(asset.asset_type, asset.asset_subtype)}
        </p>
      </div>
      <StepIndicator current="output" />

      {/* Output blocks */}
      <OutputPanel
        assetId={assetId}
        fieldsText={fieldsText}
        initialDescription={(asset.description as string | null) ?? null}
      />

      {/* New Asset button */}
      <div className="mt-8">
        <Link
          href="/assets/new"
          className="flex items-center justify-center w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-11 px-4 text-sm font-semibold transition-colors"
        >
          Book In New Asset
        </Link>
      </div>
    </div>
  )
}
