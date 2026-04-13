'use client'
import { useRouter } from 'next/navigation'

export function PhotosPageCTA({ assetId }: { assetId: string }) {
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/assets/${assetId}/extract?autostart=1`)}
      className="flex items-center justify-center w-full h-11 rounded-md bg-[oklch(0.29_0.07_248)] hover:bg-[oklch(0.29_0.07_248)]/90 text-white font-medium text-sm transition-colors"
    >
      Run AI Extraction
    </button>
  )
}
