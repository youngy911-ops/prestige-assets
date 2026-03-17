'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BranchSelector } from '@/components/asset/BranchSelector'
import { AssetTypeSelector } from '@/components/asset/AssetTypeSelector'
import { AssetSubtypeSelector } from '@/components/asset/AssetSubtypeSelector'
import { createAsset } from '@/lib/actions/asset.actions'
import { SCHEMA_REGISTRY } from '@/lib/schema-registry/index'
import type { AssetType } from '@/lib/schema-registry/types'
import type { BranchKey } from '@/lib/constants/branches'

const LAST_BRANCH_KEY = 'lastUsedBranch'

type WizardStep = 1 | 2 | 3

export default function NewAssetPage() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(1)
  const [branch, setBranch] = useState<BranchKey | null>(null)
  const [assetType, setAssetType] = useState<AssetType | null>(null)
  const [assetSubtype, setAssetSubtype] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-select last-used branch from localStorage
  useEffect(() => {
    const last = localStorage.getItem(LAST_BRANCH_KEY) as BranchKey | null
    if (last) setBranch(last)
  }, [])

  function handleBranchSelect(b: BranchKey) {
    setBranch(b)
  }

  function handleTypeSelect(t: AssetType) {
    setAssetType(t)
    setAssetSubtype(null) // reset subtype when type changes
  }

  function handleNext() {
    if (step === 1 && branch) {
      localStorage.setItem(LAST_BRANCH_KEY, branch)
      setStep(2)
    } else if (step === 2 && assetType) {
      setStep(3)
    }
  }

  function handleBack() {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
  }

  async function handleContinue() {
    if (!branch || !assetType || !assetSubtype) return
    setSubmitting(true)
    setError(null)
    const result = await createAsset(branch, assetType, assetSubtype)
    if ('error' in result) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    router.push(`/assets/${result.assetId}`)
  }

  const stepHeadings = {
    1: { heading: 'Select Branch', subheading: 'Which branch is booking this asset?' },
    2: { heading: 'Asset Type',    subheading: 'What type of asset are you booking in?' },
    3: {
      heading: assetType ? `${SCHEMA_REGISTRY[assetType].displayName} — Subtype` : 'Subtype',
      subheading: 'Select the specific subtype.',
    },
  }

  const canProceed = step === 1 ? !!branch : step === 2 ? !!assetType : !!assetSubtype
  const { heading, subheading } = stepHeadings[step]

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+24px)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        {step > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="text-white/65 hover:text-white transition-colors p-1 -ml-1"
            aria-label="Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-white">{heading}</h1>
          <p className="text-white/65 text-sm mt-0.5">{subheading}</p>
        </div>
      </div>

      {/* Step content */}
      <div className="mb-8">
        {step === 1 && (
          <BranchSelector selected={branch} onSelect={handleBranchSelect} />
        )}
        {step === 2 && (
          <AssetTypeSelector selected={assetType} onSelect={handleTypeSelect} />
        )}
        {step === 3 && assetType && (
          <AssetSubtypeSelector
            assetType={assetType}
            selected={assetSubtype}
            onSelect={setAssetSubtype}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[#F87171] text-sm mb-4">{error}</p>
      )}

      {/* Action button */}
      {step < 3 ? (
        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-white h-11 disabled:opacity-40"
        >
          Next
        </Button>
      ) : (
        <Button
          onClick={handleContinue}
          disabled={!canProceed || submitting}
          className="w-full bg-[#1E3A5F] hover:bg-[#1E3A5F]/90 text-white h-11 disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
        </Button>
      )}
    </div>
  )
}
