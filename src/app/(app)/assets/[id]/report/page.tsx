import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { generateFieldsBlock } from '@/lib/output/generateFieldsBlock'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'
import { ReportClient } from '@/components/asset/ReportClient'

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: assetId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, description, inspection_notes')
    .eq('id', assetId)
    .single()

  if (!asset) redirect('/')

  const { data: photos } = await supabase
    .from('asset_photos')
    .select('storage_path, sort_order')
    .eq('asset_id', assetId)
    .order('sort_order', { ascending: true })

  const signedUrls: string[] = (
    await Promise.all(
      (photos ?? []).map(async (p) => {
        const { data } = await supabase.storage
          .from('photos')
          .createSignedUrl(p.storage_path, 3600)
        return data?.signedUrl ?? null
      })
    )
  ).filter((url): url is string => url !== null)

  const fieldsText = generateFieldsBlock(
    asset.asset_type as AssetType,
    (asset.fields ?? {}) as Record<string, string>
  )

  const title = getAssetDisplayTitle(asset.asset_type, asset.asset_subtype)

  return (
    <ReportClient
      assetId={assetId}
      title={title}
      fieldsText={fieldsText}
      description={(asset.description as string | null) ?? null}
      photoUrls={signedUrls}
    />
  )
}
