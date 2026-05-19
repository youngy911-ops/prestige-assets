import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse request body
  let assetId: string, message: string, assetType: string
  try {
    const body = await req.json()
    assetId = body.assetId
    message = body.message?.trim() ?? ''
    assetType = body.assetType ?? 'unknown'
    if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 })
    if (!message) return Response.json({ error: 'message required' }, { status: 400 })
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // 3. Load existing inspection_notes — RLS enforces ownership
  const { data: asset, error: assetError } = await supabase
    .from('assets')
    .select('inspection_notes')
    .eq('id', assetId)
    .eq('user_id', user.id)
    .single()

  if (assetError || !asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  const existingNotes = asset.inspection_notes ?? ''

  // 4. Call AI to format the user's message as structured inspection notes
  const { text: formattedNotes } = await generateText({
    model: openai('gpt-4o'),
    system: `You are an assistant that formats freeform asset inspection notes for ${assetType} assets into concise structured lines that will help GPT-4o extract and describe the asset accurately.

Extract specific details from what the inspector says and format them clearly, one item per line.
Use short, direct labels followed by the value.

FORMATTING RULES:
- Each observation on its own line
- Label: Value format where applicable
- Use exact field-style labels for key specs
- Keep it factual — no opinions

COMMON PATTERNS:
Inspector says → Format as:
"no keys" → "Master key: No\nSpare key: No"
"one key" → "Master key: Yes\nSpare key: No"
"two keys" → "Master key: Yes\nSpare key: Yes"
"runs" / "starts" → "Driveable: Yes"
"non runner" / "doesn't start" / "seized" → "Driveable: No"
"log books" / "full service history" → "Service history: Full Service History — Log Books"
"no history" / "no log books" → "Service history: No Service History"
"bull bar" → "Bull bar: Fitted"
"tow bar" → "Tow bar: Fitted"
"snorkel" → "Snorkel: Fitted"
"canopy" → "Canopy: Fitted"
"diff locks" → "Diff locks: Fitted"
"exhaust brake" → "Exhaust brake: Fitted"
"cracked windscreen" → "Damage: Cracked windscreen"
"dent to [location]" → "Damage: Dent to [location]"
"rust" → "Damage: Rust — [location if specified]"
"UHF" / "uhf radio" → "UHF Antenna: Fitted"
"GPS" / "sat nav" → "GPS: Fitted"
"paint" [colour] → "Colour: [colour]"
"[X] hours" → "Hours: [X]"
"[X] km" or "[X]k km" → "Odometer: [X]km"
"purple" / "red" / "blue" etc → "Colour: [colour]"

For items not matching these patterns, format as a descriptive Note:
"Note: [what the inspector said in their own words]"

Output ONLY the formatted lines — no preamble, no explanation, no extra text.`,
    prompt: `The user said: "${message}"`,
  })

  // 5. Append formatted notes to existing inspection_notes
  const separator = existingNotes.trim() ? '\n' : ''
  const updatedNotes = existingNotes.trim() + separator + formattedNotes.trim()

  const { error: updateError } = await supabase
    .from('assets')
    .update({ inspection_notes: updatedNotes })
    .eq('id', assetId)
    .eq('user_id', user.id)

  if (updateError) return Response.json({ error: updateError.message }, { status: 500 })

  return Response.json({ notes: updatedNotes })
}
