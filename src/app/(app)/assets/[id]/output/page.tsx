import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { BRAND } from '@/lib/constants/brand'
import { generateFieldsBlock } from '@/lib/output/generateFieldsBlock'
import { OutputPanel } from '@/components/asset/OutputPanel'
import { StepIndicator } from '@/components/asset/StepIndicator'
import { DeleteAssetButton } from '@/components/asset/DeleteAssetButton'
import { SalesforcePushButton } from '@/components/asset/SalesforcePushButton'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

export default async function OutputPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Pipeline signed URL generation: chain createSignedUrls off the photos query so it
  // fires as soon as storage paths arrive, overlapping with the asset + sfConn queries.
  const [{ data: asset }, photoUrls, { data: sfConn }] = await Promise.all([
    supabase
      .from('assets')
      .select('id, asset_type, asset_subtype, fields, description, status, extraction_result')
      .eq('id', assetId)
      .single(),
    supabase
      .from('asset_photos')
      .select('storage_path, sort_order')
      .eq('asset_id', assetId)
      .order('sort_order', { ascending: true })
      .then(async ({ data: photos }) => {
        const photoList = photos ?? []
        if (photoList.length === 0) return [] as string[]
        const { data: signedUrlData } = await supabase.storage
          .from('photos')
          .createSignedUrls(photoList.map(p => p.storage_path), 3600)
        return (signedUrlData ?? [])
          .map(r => r.signedUrl)
          .filter((u): u is string => !!u)
      }),
    supabase
      .from('salesforce_connections')
      .select('user_id')
      .eq('user_id', user.id)
      .single(),
  ])

  if (!asset) redirect('/assets/new')

  // Compute fields block server-side — fall back to extraction_result values if fields not yet saved
  const savedFields = (asset.fields ?? {}) as Record<string, string>
  const extractedFields = asset.extraction_result
    ? Object.fromEntries(
        Object.entries(asset.extraction_result as Record<string, { value: string | null }>)
          .filter(([, v]) => v?.value != null)
          .map(([k, v]) => [k, v.value as string])
      )
    : {}
  const effectiveFields = Object.keys(savedFields).length > 0 ? savedFields : extractedFields
  const fieldsText = generateFieldsBlock(
    asset.asset_type as AssetType,
    effectiveFields
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
      {asset.status === 'draft' && <StepIndicator current="output" />}

      {/* Output blocks */}
      <OutputPanel
        assetId={assetId}
        assetType={asset.asset_type}
        fields={effectiveFields}
        fieldsText={fieldsText}
        initialDescription={(asset.description as string | null) ?? null}
        photoUrls={photoUrls}
        extractionResult={asset.extraction_result as Record<string, { value: string | null; confidence: 'high' | 'medium' | 'low' | null }> | null}
      />

      {/* QR Code + actions */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&bgcolor=1a2e1a&color=ffffff&data=${encodeURIComponent(`https://${BRAND.domain}/assets/${assetId}/output`)}`}
            alt="QR code for this asset"
            width={80}
            height={80}
            className="rounded-lg flex-shrink-0"
          />
          <div>
            <p className="text-sm font-medium text-white">Asset QR Code</p>
            <p className="text-xs text-white/45 mt-0.5">Scan to reopen this record on any device</p>
            <Link
              href={`/assets/${assetId}/report`}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 mt-2 transition-colors"
            >
              View condition report →
            </Link>
          </div>
        </div>
        <SalesforcePushButton
          assetId={assetId}
          isConnected={!!sfConn}
          returnTo={`/assets/${assetId}/output`}
        />
        <Link
          href="/"
          className="flex items-center justify-center w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white h-11 px-4 text-sm font-semibold transition-colors"
        >
          Back to Assets
        </Link>
        <Link
          href="/assets/new"
          className="flex items-center justify-center w-full rounded-xl border border-white/15 hover:border-white/30 text-white/70 hover:text-white h-11 px-4 text-sm font-medium transition-colors"
        >
          Book In New Asset
        </Link>
        <DeleteAssetButton assetId={assetId} />
      </div>
    </div>
  )
}
