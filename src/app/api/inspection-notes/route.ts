import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse request body
  let assetId: string, notes: string
  try {
    const body = await req.json()
    assetId = body.assetId
    notes = body.notes ?? ''
    if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // 3. Update inspection_notes — RLS enforces ownership via user_id guard
  const { error } = await supabase
    .from('assets')
    .update({ inspection_notes: notes })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
