'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
  return (data ?? []) as AssetSummary[]
}
