'use client'
import { useState, useEffect, useRef } from 'react'
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
  const [submitLabel, setSubmitLabel] = useState('Creating…')
  const [error, setError] = useState<string | null>(null)
  // Files from auto-detect — uploaded after asset creation, skip photos page
  const pendingFilesRef = useRef<File[]>([])

  useEffect(() => {
    const last = localStorage.getItem(LAST_BRANCH_KEY) as BranchKey | null
    if (last) {
      setBranch(last)
      setStep(2)
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
    pendingFilesRef.current = []
    setStep(3)
  }

  async function handleSubtypeSelect(subtype: string) {
    if (!branch || !assetType) return
    setAssetSubtype(subtype)
    setSubmitting(true)
    setSubmitLabel('Creating…')
    setError(null)

    const result = await createAsset(branch, assetType, subtype)
    if ('error' in result) {
      setError(result.error)
      setSubmitting(false)
      return
    }
    const assetId = result.assetId

    const files = pendingFilesRef.current
    if (files.length > 0) {
      // Upload detected photos then go straight to extract
      setSubmitLabel(`Uploading ${files.length} photo${files.length !== 1 ? 's' : ''}…`)
      await Promise.allSettled(
        files.map((file, i) => {
          const fd = new FormData()
          fd.append('file', file)
          fd.append('assetId', assetId)
          fd.append('sortOrder', String(i))
          return fetch('/api/upload-photo', { method: 'POST', body: fd })
        })
      )
      router.push(`/assets/${assetId}/extract?autostart=1`)
    } else {
      router.push(`/assets/${assetId}/photos`)
    }
  }

  function handleBack() {
    if (step === 2) router.push('/')
    if (step === 3) { setStep(2); pendingFilesRef.current = [] }
  }

  const stepHeadings = {
    1: { heading: 'Select Branch', subheading: 'Which branch is booking this asset?' },
    2: { heading: 'Asset Type',    subheading: 'Upload photos to auto-detect, or select manually.' },
    3: {
      heading: assetType ? `${SCHEMA_REGISTRY[assetType].displayName} — Subtype` : 'Subtype',
      subheading: 'Select the specific subtype.',
    },
  }

  const { heading, subheading } = stepHeadings[step]

  return (
    <div className="max-w-[480px] mx-auto px-4 pt-8 pb-[calc(env(safe-area-inset-bottom)+24px)]">
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

      <div className="mb-8">
        {step === 1 && (
          <BranchSelector selected={branch} onSelect={handleBranchSelect} />
        )}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <AutoDetectButton
              onDetected={(type, subtype, files) => {
                pendingFilesRef.current = files
                setAssetType(type)
                if (subtype) {
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

      {error && <p className="text-destructive text-sm mb-4">{error}</p>}

      {submitting && (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-white/65" />
          <span className="text-sm text-white/65">{submitLabel}</span>
        </div>
      )}
    </div>
  )
}
