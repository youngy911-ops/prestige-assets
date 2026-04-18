import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Initiates Salesforce OAuth — redirects user to Salesforce login
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.SALESFORCE_CLIENT_ID
  const redirectUri = process.env.SALESFORCE_REDIRECT_URI
  if (!clientId || !redirectUri) {
    return new Response('Salesforce integration not configured', { status: 503 })
  }

  // Pass the return URL via state so the callback can redirect back to the asset
  const returnTo = req.nextUrl.searchParams.get('returnTo') ?? '/'

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'api refresh_token openid',
    state: returnTo,
  })

  return Response.redirect(
    `https://login.salesforce.com/services/oauth2/authorize?${params.toString()}`
  )
}
