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
  revalidatePath('/assets')
  return { assetId: data.id }
}
