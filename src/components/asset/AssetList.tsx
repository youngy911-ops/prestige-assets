'use client'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { BRANCHES, type BranchKey } from '@/lib/constants/branches'
import { getAssets, type AssetSummary } from '@/lib/actions/asset.actions'
import { AssetCard } from './AssetCard'

const LAST_BRANCH_KEY = 'lastUsedBranch'

interface AssetListProps {
  branch: BranchKey
  onBranchChange: (branch: BranchKey) => void
}

export function AssetList({ branch, onBranchChange }: AssetListProps) {
  const [assets, setAssets] = useState<AssetSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [changingBranch, setChangingBranch] = useState(false)

  useEffect(() => {
    setAssets(null)
    setError(null)
    getAssets(branch).then(result => {
      if ('error' in result) {
        setError(result.error)
      } else {
        setAssets(result)
      }
    })
  }, [branch])

  const branchLabel = BRANCHES.find(b => b.key === branch)?.label ?? branch

  return (
    <div className="max-w-[640px] mx-auto px-4 pt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Assets</h1>
      </div>

      {/* Branch header chip */}
      <div className="mb-6">
        {changingBranch ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-white/65 mb-2">Select branch:</p>
            {BRANCHES.map(b => (
              <button
                key={b.key}
                type="button"
                onClick={() => {
                  localStorage.setItem(LAST_BRANCH_KEY, b.key)
                  onBranchChange(b.key as BranchKey)
                  setChangingBranch(false)
                }}
                className={`w-full text-left px-4 py-3 rounded-lg text-base text-white transition-all min-h-[48px] border ${
                  b.key === branch
                    ? 'border-emerald-500/60 bg-emerald-500/10'
                    : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
              >
                {b.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setChangingBranch(false)}
              className="text-sm text-white/65 mt-2 underline"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setChangingBranch(true)}
            className="inline-flex items-center gap-1 text-sm text-white/65 hover:text-white transition-colors border border-white/[0.12] rounded-lg px-3 py-1.5"
          >
            {branchLabel}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* List states */}
      {error && (
        <div className="text-center py-16">
          <p className="text-white text-base font-medium">Could not load assets.</p>
          <p className="text-white/65 text-sm mt-2">Check your connection and refresh.</p>
        </div>
      )}

      {!error && assets === null && (
        <div className="text-center py-16">
          <p className="text-white/65 text-sm">Loading...</p>
        </div>
      )}

      {!error && assets !== null && assets.length === 0 && (
        <div className="text-center py-16">
          <p className="text-white text-base font-medium">No assets yet</p>
          <p className="text-white/65 text-sm mt-2">Tap New Asset to start booking in an asset.</p>
        </div>
      )}

      {!error && assets !== null && assets.length > 0 && (
        <div className="flex flex-col gap-4">
          {assets.map(asset => (
            <AssetCard
              key={asset.id}
              id={asset.id}
              asset_type={asset.asset_type}
              asset_subtype={asset.asset_subtype}
              fields={(asset.fields ?? {}) as Record<string, string>}
              status={asset.status}
              updated_at={asset.updated_at}
            />
          ))}
        </div>
      )}
    </div>
  )
}
