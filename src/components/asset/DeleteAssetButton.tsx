'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { deleteAsset } from '@/lib/actions/asset.actions'

interface DeleteAssetButtonProps {
  assetId: string
}

export function DeleteAssetButton({ assetId }: DeleteAssetButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      return
    }
    setDeleting(true)
    const result = await deleteAsset(assetId)
    if ('success' in result) {
      router.push('/')
    } else {
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={handleDelete}
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 h-11 px-4 text-sm font-semibold transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete Asset
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
      <span className="text-sm text-red-300 flex-1">Permanently delete this asset?</span>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm font-semibold text-white bg-red-600 hover:bg-red-500 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
      >
        {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
        Delete
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-white/50 hover:text-white/80 px-2 py-1.5 transition-colors"
      >
        Cancel
      </button>
    </div>
  )
}
