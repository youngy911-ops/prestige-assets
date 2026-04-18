import 'server-only'
import { createClient } from '@/lib/supabase/server'

const SF_API_VERSION = 'v62.0'

export type SalesforceConnection = {
  instance_url: string
  access_token: string
  refresh_token: string
}

export async function getSalesforceConnection(): Promise<SalesforceConnection | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('salesforce_connections')
    .select('instance_url, access_token, refresh_token')
    .eq('user_id', user.id)
    .single()

  return data ?? null
}

export async function sfRequest(
  conn: SalesforceConnection,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${conn.instance_url}/services/data/${SF_API_VERSION}${path}`
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${conn.access_token}`,
      ...options.headers,
    },
  })
}

export async function refreshSalesforceToken(conn: SalesforceConnection): Promise<string | null> {
  const clientId = process.env.SALESFORCE_CLIENT_ID
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: conn.refresh_token,
  })

  const res = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    body: params,
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.access_token ?? null
}
