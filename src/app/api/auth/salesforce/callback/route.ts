import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.redirect(new URL('/login', req.url))

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') ?? '/'
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    return Response.redirect(new URL(`${state}?sf_error=auth_failed`, req.url))
  }

  const clientId = process.env.SALESFORCE_CLIENT_ID
  const clientSecret = process.env.SALESFORCE_CLIENT_SECRET
  const redirectUri = process.env.SALESFORCE_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    return Response.redirect(new URL(`${state}?sf_error=not_configured`, req.url))
  }

  // Exchange auth code for tokens
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  })

  const tokenRes = await fetch('https://login.salesforce.com/services/oauth2/token', {
    method: 'POST',
    body: params,
  })

  if (!tokenRes.ok) {
    return Response.redirect(new URL(`${state}?sf_error=token_failed`, req.url))
  }

  const tokens = await tokenRes.json()

  await supabase.from('salesforce_connections').upsert({
    user_id: user.id,
    instance_url: tokens.instance_url,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
  }, { onConflict: 'user_id' })

  return Response.redirect(new URL(`${state}?sf_connected=1`, req.url))
}
