'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle, Cloud } from 'lucide-react'

interface SalesforcePushButtonProps {
  assetId: string
  isConnected: boolean
  returnTo: string
}

type PushState = 'idle' | 'pushing' | 'success' | 'error'

export function SalesforcePushButton({ assetId, isConnected, returnTo }: SalesforcePushButtonProps) {
  const searchParams = useSearchParams()
  const [pushState, setPushState] = useState<PushState>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [salesforceId, setSalesforceId] = useState<string | null>(null)

  // Show success toast if just connected via OAuth callback
  const justConnected = searchParams.get('sf_connected') === '1'
  const authError = searchParams.get('sf_error')

  useEffect(() => {
    if (justConnected && isConnected) {
      // Auto-push after successful OAuth connection
      handlePush()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handlePush() {
    setPushState('pushing')
    setErrorMsg(null)
    try {
      const res = await fetch('/api/salesforce/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'not_connected') {
          window.location.href = `/api/auth/salesforce?returnTo=${encodeURIComponent(returnTo)}`
          return
        }
        throw new Error(data.error ?? 'Push failed')
      }
      setSalesforceId(data.salesforce_id)
      setPushState('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Something went wrong')
      setPushState('error')
    }
  }

  function handleConnect() {
    window.location.href = `/api/auth/salesforce?returnTo=${encodeURIComponent(returnTo)}`
  }

  if (pushState === 'success') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-emerald-300">Pushed to Salesforce</p>
          {salesforceId && (
            <p className="text-xs text-white/40 mt-0.5 font-mono">{salesforceId}</p>
          )}
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleConnect}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/[0.12] bg-white/[0.04] hover:bg-white/[0.08] text-white h-11 px-4 text-sm font-semibold transition-colors"
        >
          <Cloud className="w-4 h-4 text-white/50" />
          Connect Salesforce to Push
        </button>
        {authError && (
          <p className="text-xs text-red-400 text-center">Salesforce login failed — try again</p>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handlePush}
        disabled={pushState === 'pushing'}
        className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00a1e0] hover:bg-[#0090c8] text-white h-11 px-4 text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {pushState === 'pushing' ? (
          <><Loader2 className="w-4 h-4 animate-spin" />Pushing to Salesforce…</>
        ) : (
          <><Cloud className="w-4 h-4" />Push to Salesforce</>
        )}
      </button>
      {pushState === 'error' && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {errorMsg ?? 'Push failed — check connection and try again'}
        </div>
      )}
    </div>
  )
}
