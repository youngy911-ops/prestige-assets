'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0f1f0f', color: 'white', fontFamily: 'system-ui', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Something went wrong</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            An unexpected error prevented the app from loading.
          </p>
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>Show details</summary>
            <pre style={{ marginTop: '0.5rem', fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
          <button
            onClick={reset}
            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', background: '#3a7a3a', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{ display: 'inline-block', marginTop: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', textDecoration: 'underline', textUnderlineOffset: '4px' }}
          >
            Go to home
          </a>
        </div>
      </body>
    </html>
  )
}
