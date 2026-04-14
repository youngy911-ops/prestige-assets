import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getAssets, type AssetSummary } from '@/lib/actions/asset.actions'
import { HomePageClient } from '@/components/asset/HomePageClient'
import type { BranchKey } from '@/lib/constants/branches'

export default async function AssetsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const cookieStore = await cookies()
  const branch = (cookieStore.get('lastUsedBranch')?.value ?? null) as BranchKey | null

  // Pre-fetch assets server-side if branch is known — eliminates client-side loading delay
  let initialAssets: AssetSummary[] | null = null
  if (branch) {
    const result = await getAssets(branch)
    if (!('error' in result)) initialAssets = result
  }

  return <HomePageClient initialBranch={branch} initialAssets={initialAssets} />
}
