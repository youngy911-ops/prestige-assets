'use server'
import { createClient } from '@/lib/supabase/server'

export async function saveInspectionNotes(
  assetId: string,
  notes: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('assets')
    .update({ inspection_notes: notes })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return {}
}
