'use client'
import { useEffect, useState } from 'react'
import type { BranchKey } from '@/lib/constants/branches'
import { BranchPickerScreen } from '@/components/asset/BranchPickerScreen'
import { AssetList } from '@/components/asset/AssetList'

const LAST_BRANCH_KEY = 'lastUsedBranch'

export default function AssetsPage() {
  // undefined = loading (no flash); null = no branch; BranchKey = branch known
  const [branch, setBranch] = useState<BranchKey | null | undefined>(undefined)

  useEffect(() => {
    const saved = localStorage.getItem(LAST_BRANCH_KEY) as BranchKey | null
    setBranch(saved)
  }, [])

  // Hydration guard — render nothing until localStorage is read
  if (branch === undefined) return null

  if (!branch) {
    return (
      <BranchPickerScreen
        onSelect={(b) => {
          localStorage.setItem(LAST_BRANCH_KEY, b)
          setBranch(b)
        }}
      />
    )
  }

  return (
    <AssetList
      branch={branch}
      onBranchChange={(b) => {
        localStorage.setItem(LAST_BRANCH_KEY, b)
        setBranch(b)
      }}
    />
  )
}
