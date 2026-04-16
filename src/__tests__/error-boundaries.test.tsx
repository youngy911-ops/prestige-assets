import { describe, it, expect } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

describe('Error boundary content', () => {
  const appErrorPath = path.resolve(__dirname, '..', 'app', '(app)', 'error.tsx')
  const authErrorPath = path.resolve(__dirname, '..', 'app', '(auth)', 'error.tsx')
  const globalErrorPath = path.resolve(__dirname, '..', 'app', 'global-error.tsx')
  const errorDisplayPath = path.resolve(__dirname, '..', 'components', 'error', 'ErrorDisplay.tsx')

  it('app error boundary contains classifyError function', () => {
    const content = fs.readFileSync(appErrorPath, 'utf-8')
    expect(content).toContain('classifyError')
  })

  it('app error boundary has auth error copy', () => {
    const content = fs.readFileSync(appErrorPath, 'utf-8')
    expect(content).toContain('Your session has expired')
  })

  it('app error boundary has asset error copy', () => {
    const content = fs.readFileSync(appErrorPath, 'utf-8')
    expect(content).toContain("This asset couldn't be loaded")
  })

  it('app error boundary has server error copy', () => {
    const content = fs.readFileSync(appErrorPath, 'utf-8')
    expect(content).toContain('Something went wrong')
  })

  it('app error boundary links to /assets and /login', () => {
    const content = fs.readFileSync(appErrorPath, 'utf-8')
    expect(content).toContain('href="/assets"')
    expect(content).toContain('href="/login"')
  })

  it('auth error boundary shows session expired message', () => {
    const content = fs.readFileSync(authErrorPath, 'utf-8')
    expect(content).toContain('Your session has expired')
  })

  it('auth error boundary links to /login', () => {
    const content = fs.readFileSync(authErrorPath, 'utf-8')
    expect(content).toContain('href="/login"')
  })

  it('global error boundary has Go to home link', () => {
    const content = fs.readFileSync(globalErrorPath, 'utf-8')
    expect(content).toContain('Go to home')
    expect(content).toContain('href="/"')
  })

  it('global error boundary uses only inline styles (no className)', () => {
    const content = fs.readFileSync(globalErrorPath, 'utf-8')
    expect(content).not.toMatch(/className=/)
  })

  it('ErrorDisplay component has Show details toggle', () => {
    const content = fs.readFileSync(errorDisplayPath, 'utf-8')
    expect(content).toContain('Show details')
    expect(content).toContain('error.digest')
  })

  it('no hardcoded bg-emerald in error boundaries', () => {
    const files = [appErrorPath, authErrorPath]
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf-8')
      expect(content, `${f} contains bg-emerald`).not.toContain('bg-emerald')
    }
  })
})

describe('Edit-type route removal (ERR-02)', () => {
  it('edit-type page.tsx no longer exists', () => {
    const editTypePath = path.resolve(__dirname, '..', 'app', '(app)', 'assets', '[id]', 'edit-type', 'page.tsx')
    expect(fs.existsSync(editTypePath), `${editTypePath} should not exist`).toBe(false)
  })
})
