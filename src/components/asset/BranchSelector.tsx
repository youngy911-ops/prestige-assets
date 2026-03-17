'use client'
import { BRANCHES, type BranchKey } from '@/lib/constants/branches'
import { cn } from '@/lib/utils'

interface BranchSelectorProps {
  selected: BranchKey | null
  onSelect: (branch: BranchKey) => void
}

export function BranchSelector({ selected, onSelect }: BranchSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      {BRANCHES.map(branch => (
        <button
          key={branch.key}
          type="button"
          onClick={() => onSelect(branch.key as BranchKey)}
          className={cn(
            'w-full text-left px-4 py-3 rounded-lg text-base text-white transition-all min-h-[48px]',
            'border-2',
            selected === branch.key
              ? 'border-white bg-white/10'
              : 'border-[#1E3A5F] bg-[#14532D] hover:bg-white/5'
          )}
        >
          {branch.label}
        </button>
      ))}
    </div>
  )
}
