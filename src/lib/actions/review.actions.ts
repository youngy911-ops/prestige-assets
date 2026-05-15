'use server'
import { createClient } from '@/lib/supabase/server'

export async function saveDescription(
  assetId: string,
  description: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('assets')
    .update({ description })
    .eq('id', assetId)
    .eq('user_id', user.id)
}

export async function saveReview(
  assetId: string,
  fields: Record<string, string>,
  checklistState: Record<string, string>
): Promise<{ error: string; redirectTo?: never } | { redirectTo: string; error?: never }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('assets')
    .update({
      fields,
      checklist_state: checklistState,
      status: 'reviewed',
      description: null,  // Clear cached description — output page will regenerate for fresh fields
    })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  // Return the destination URL — the client navigates immediately (optimistic),
  // so no revalidatePath needed and no server-side redirect blocking the response.
  return { redirectTo: `/assets/${assetId}/output` }
}
