'use client'
import { useState } from 'react'

export function ShareLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 text-xs mt-1 transition-colors ${copied ? 'text-emerald-400' : 'text-white/40 hover:text-white/70'}`}
    >
      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M4.5 2H2.5A.5.5 0 002 2.5v7a.5.5 0 00.5.5h7a.5.5 0 00.5-.5V8M7 2h3m0 0v3m0-3L5 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}
