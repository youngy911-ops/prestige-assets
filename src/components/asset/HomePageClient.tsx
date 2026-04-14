'use client'
import { useEffect, useState } from 'react'
import type { BranchKey } from '@/lib/constants/branches'
import type { AssetSummary } from '@/lib/actions/asset.actions'
import { getAssets } from '@/lib/actions/asset.actions'
import { BranchPickerScreen } from '@/components/asset/BranchPickerScreen'
import { AssetList } from '@/components/asset/AssetList'

const LAST_BRANCH_KEY = 'lastUsedBranch'

function saveBranch(branch: BranchKey) {
  try { localStorage.setItem(LAST_BRANCH_KEY, branch) } catch {}
  document.cookie = `lastUsedBranch=${branch}; path=/; max-age=31536000; SameSite=Lax`
}

interface HomePageClientProps {
  initialBranch: BranchKey | null
  initialAssets: AssetSummary[] | null
}

export function HomePageClient({ initialBranch, initialAssets }: HomePageClientProps) {
  const [branch, setBranch] = useState<BranchKey | null>(initialBranch)
  const [migratedAssets, setMigratedAssets] = useState<AssetSummary[] | null>(initialAssets)

  // Migration: if server had no cookie but localStorage has a branch, promote it
  useEffect(() => {
    if (branch) return  // Already have a branch from cookie — nothing to migrate
    try {
      const saved = localStorage.getItem(LAST_BRANCH_KEY) as BranchKey | null
      if (!saved) return
      saveBranch(saved)  // Write cookie for future server-side reads
      setBranch(saved)
      // Fetch assets now since server couldn't pre-load without the cookie
      getAssets(saved).then(result => {
        if (!('error' in result)) setMigratedAssets(result)
      })
    } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!branch) {
    return (
      <BranchPickerScreen
        onSelect={(b) => {
          saveBranch(b)
          setBranch(b)
        }}
      />
    )
  }

  return (
    <AssetList
      branch={branch}
      initialAssets={migratedAssets}
      onBranchChange={(b) => {
        saveBranch(b)
        setBranch(b)
        setMigratedAssets(null)  // Clear so AssetList re-fetches for new branch
      }}
    />
  )
}
