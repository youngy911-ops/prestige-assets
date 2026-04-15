'use server'
import { createClient } from '@/lib/supabase/server'

export async function createAsset(
  branch: string,
  assetType: string,
  assetSubtype: string
): Promise<{ assetId: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id: user.id,
      branch,
      asset_type: assetType,
      asset_subtype: assetSubtype,
      fields: {},
      status: 'draft',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  return { assetId: data.id }
}

export type AssetSummary = {
  id: string
  asset_type: string
  asset_subtype: string | null
  fields: Record<string, string>
  status: 'draft' | 'confirmed'
  updated_at: string
  thumb_url: string | null
}

export async function getAssets(branch: string): Promise<AssetSummary[] | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, status, updated_at')
    .eq('user_id', user.id)
    .eq('branch', branch)
    .order('updated_at', { ascending: false })

  if (error) return { error: error.message }

  // Return immediately — no thumbnail fetching here.
  // Thumbnails are loaded separately via getAssetThumbs() so the list
  // renders in ~1 round-trip instead of 4.
  return (data ?? []).map(a => ({ ...a, thumb_url: null })) as AssetSummary[]
}

// Separate fast action: given a list of asset IDs, returns { [assetId]: signedUrl }
// Called client-side after the list renders so thumbnails never block first paint.
export async function getAssetThumbs(
  assetIds: string[]
): Promise<Record<string, string>> {
  if (assetIds.length === 0) return {}
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}

  const { data: photos } = await supabase
    .from('asset_photos')
    .select('asset_id, storage_path')
    .in('asset_id', assetIds)
    .order('sort_order', { ascending: true })

  const firstPhotoMap = new Map<string, string>()
  for (const p of photos ?? []) {
    if (!firstPhotoMap.has(p.asset_id)) firstPhotoMap.set(p.asset_id, p.storage_path)
  }

  const storagePaths = [...firstPhotoMap.values()]
  if (storagePaths.length === 0) return {}

  const { data: signedUrlData } = await supabase.storage
    .from('photos')
    .createSignedUrls(storagePaths, 600)

  const urlByPath = new Map((signedUrlData ?? []).map(r => [r.path, r.signedUrl]))

  const result: Record<string, string> = {}
  for (const [assetId, path] of firstPhotoMap) {
    const url = urlByPath.get(path)
    if (url) result[assetId] = url
  }
  return result
}

export async function getTodayBookingCount(): Promise<number> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('assets')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', todayStart.toISOString())

  return count ?? 0
}
