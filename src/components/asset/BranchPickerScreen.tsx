'use client'
import { BranchSelector } from '@/components/asset/BranchSelector'
import type { BranchKey } from '@/lib/constants/branches'

interface BranchPickerScreenProps {
  onSelect: (branch: BranchKey) => void
}

export function BranchPickerScreen({ onSelect }: BranchPickerScreenProps) {
  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+80px)]">
      <h1 className="text-xl font-semibold text-white mb-2">Select your branch</h1>
      <p className="text-sm text-white/65 mb-6">Your branch is saved — you can change it any time.</p>
      <BranchSelector selected={null} onSelect={onSelect} />
    </div>
  )
}
