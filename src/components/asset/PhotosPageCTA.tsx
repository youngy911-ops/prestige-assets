'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PhotosPageCTA({ assetId }: { assetId: string }) {
  const router = useRouter()
  const [starting, setStarting] = useState(false)

  const handleRun = async () => {
    setStarting(true)
    // Fire POST and immediately navigate — extraction runs in background on the server.
    // The /extract page will show loading state until extraction_result is written to DB.
    fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId }),
    })
    router.push(`/assets/${assetId}/extract`)
  }

  return (
    <button
      onClick={handleRun}
      disabled={starting}
      className="flex items-center justify-center w-full h-11 rounded-md bg-[oklch(0.29_0.07_248)] hover:bg-[oklch(0.29_0.07_248)]/90 text-white font-medium text-sm transition-colors disabled:opacity-70"
    >
      {starting ? 'Starting extraction…' : 'Run AI Extraction'}
    </button>
  )
}
