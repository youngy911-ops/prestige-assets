import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getSalesforceConnection, sfRequest, refreshSalesforceToken } from '@/lib/salesforce/client'
import { getAssetDisplayTitle } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { assetId } = await req.json()
  if (!assetId) return Response.json({ error: 'assetId required' }, { status: 400 })

  // Load asset + description
  const { data: asset } = await supabase
    .from('assets')
    .select('id, asset_type, asset_subtype, fields, description')
    .eq('id', assetId)
    .single()
  if (!asset) return Response.json({ error: 'Asset not found' }, { status: 404 })

  // Check Salesforce connection
  let conn = await getSalesforceConnection()
  if (!conn) return Response.json({ error: 'not_connected' }, { status: 403 })

  const fields = (asset.fields ?? {}) as Record<string, string>
  const assetType = asset.asset_type as AssetType

  // Build Salesforce Asset record name
  const nameParts = [fields.year, fields.make, fields.model].filter(Boolean)
  const name = nameParts.length > 0
    ? nameParts.join(' ')
    : getAssetDisplayTitle(assetType, asset.asset_subtype)

  const sfPayload: Record<string, string | null> = {
    Name: name,
    SerialNumber: fields.vin ?? fields.serial_number ?? null,
    Description: (asset.description as string | null) ?? null,
    Status: 'Purchased',
  }

  // Remove null fields — Salesforce rejects explicit nulls on required fields
  const cleanPayload = Object.fromEntries(
    Object.entries(sfPayload).filter(([, v]) => v !== null && v !== '')
  )

  // Attempt push — refresh token on 401 and retry once
  let res = await sfRequest(conn, '/sobjects/Asset/', {
    method: 'POST',
    body: JSON.stringify(cleanPayload),
  })

  if (res.status === 401) {
    const newToken = await refreshSalesforceToken(conn)
    if (newToken) {
      await supabase
        .from('salesforce_connections')
        .update({ access_token: newToken })
        .eq('user_id', user.id)
      conn = { ...conn, access_token: newToken }
      res = await sfRequest(conn, '/sobjects/Asset/', {
        method: 'POST',
        body: JSON.stringify(cleanPayload),
      })
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = Array.isArray(body) ? body[0]?.message : body.message
    return Response.json({ error: msg ?? 'Salesforce write failed' }, { status: 502 })
  }

  const result = await res.json()
  return Response.json({ success: true, salesforce_id: result.id })
}
