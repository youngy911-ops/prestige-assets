'use client'
import { useState } from 'react'
import type { BranchKey } from '@/lib/constants/branches'
import type { AssetSummary } from '@/lib/actions/asset.actions'
import { BranchPickerScreen } from '@/components/asset/BranchPickerScreen'
import { AssetList } from '@/components/asset/AssetList'

const LAST_BRANCH_KEY = 'lastUsedBranch'

function saveBranch(branch: BranchKey) {
  // Persist to localStorage (legacy) + cookie (server can read on next request)
  try { localStorage.setItem(LAST_BRANCH_KEY, branch) } catch {}
  document.cookie = `lastUsedBranch=${branch}; path=/; max-age=31536000; SameSite=Lax`
}

interface HomePageClientProps {
  initialBranch: BranchKey | null
  initialAssets: AssetSummary[] | null
}

export function HomePageClient({ initialBranch, initialAssets }: HomePageClientProps) {
  const [branch, setBranch] = useState<BranchKey | null>(initialBranch)

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
      initialAssets={initialAssets}
      onBranchChange={(b) => {
        saveBranch(b)
        setBranch(b)
      }}
    />
  )
}
