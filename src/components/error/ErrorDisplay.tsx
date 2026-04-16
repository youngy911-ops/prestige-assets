'use client'

import React from 'react'

interface ErrorDisplayProps {
  icon: React.ReactNode
  title: string
  message: string
  actions: React.ReactNode
  error: Error & { digest?: string }
  className?: string
}

export function ErrorDisplay({ icon, title, message, actions, error, className }: ErrorDisplayProps) {
  return (
    <div className={`mx-auto px-4 text-center ${className ?? ''}`}>
      {icon}
      <h1 className="mt-6 text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{message}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      <details className="mt-6 text-left">
        <summary className="text-xs text-muted-foreground cursor-pointer">Show details</summary>
        <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all">
          {error.message}
          {error.digest && `\nDigest: ${error.digest}`}
        </pre>
      </details>
    </div>
  )
}
