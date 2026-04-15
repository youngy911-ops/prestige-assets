'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, ChevronLeft } from 'lucide-react'
import { BranchSelector } from '@/components/asset/BranchSelector'
import { AssetTypeSelector } from '@/components/asset/AssetTypeSelector'
import { AssetSubtypeSelector } from '@/components/asset/AssetSubtypeSelector'
import { createAsset } from '@/lib/actions/asset.actions'
import { SCHEMA_REGISTRY } from '@/lib/schema-registry/index'
import { AutoDetectButton } from '@/components/asset/AutoDetectButton'
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

  // Pre-select last-used branch and skip straight to type selection
  useEffect(() => {
    const last = localStorage.getItem(LAST_BRANCH_KEY) as BranchKey | null
    if (last) {
      setBranch(last)
      setStep(2)  // Skip branch step — user already has one saved
    }
  }, [])

  function handleBranchSelect(b: BranchKey) {
    setBranch(b)
    localStorage.setItem(LAST_BRANCH_KEY, b)
    setStep(2)
  }

  function handleTypeSelect(t: AssetType) {
    setAssetType(t)
    setAssetSubtype(null)
    setStep(3)
  }

  async function handleSubtypeSelect(subtype: string) {
    if (!branch || !assetType) return
    setAssetSubtype(subtype)
    setSubmitting(true)
    setError(null)
    const result = await createAsset(branch, assetType, subtype)
    if ('error' in result) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    router.push(`/assets/${result.assetId}/photos`)
  }

  function handleBack() {
    if (step === 2) router.push('/')  // From type selection, go home (branch already saved)
    if (step === 3) setStep(2)
  }

  const stepHeadings = {
    1: { heading: 'Select Branch', subheading: 'Which branch is booking this asset?' },
    2: { heading: 'Asset Type',    subheading: 'What type of asset are you booking in?' },
    3: {
      heading: assetType ? `${SCHEMA_REGISTRY[assetType].displayName} — Subtype` : 'Subtype',
      subheading: 'Select the specific subtype.',
    },
  }

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
          <div className="flex flex-col gap-4">
            <AutoDetectButton
              onDetected={(type, subtype) => {
                setAssetType(type)
                if (subtype) {
                  // Jump straight to subtype confirmed — same as tapping subtype
                  handleSubtypeSelect(subtype)
                } else {
                  setStep(3)
                }
              }}
            />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-xs text-white/30">or select manually</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>
            <AssetTypeSelector selected={assetType} onSelect={handleTypeSelect} />
          </div>
        )}
        {step === 3 && assetType && (
          <AssetSubtypeSelector
            assetType={assetType}
            selected={assetSubtype}
            onSelect={handleSubtypeSelect}
            disabled={submitting}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-[#F87171] text-sm mb-4">{error}</p>
      )}

      {/* Spinner shown while creating asset after subtype selected */}
      {submitting && (
        <div className="flex justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-white/65" />
        </div>
      )}
    </div>
  )
}
