import { describe, it, vi, beforeEach } from 'vitest'

// Mock navigator.clipboard for JSDOM — clipboard API not available in test environment
beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

// NOTE: Component imports will be added in plan 05-03 when OutputPanel exists.
// Tests marked .todo — implemented in plan 05-03.

describe('FieldsBlock', () => {
  it.todo('renders fields text in a pre/code block')
  it.todo('copy button calls navigator.clipboard.writeText with the full fields text')
  it.todo('copy button label changes to "Copied!" immediately after click')
  it.todo('copy button label reverts to "Copy Fields" after 2000ms')
})

describe('DescriptionBlock', () => {
  it.todo('renders description text in an editable textarea')
  it.todo('copy button calls navigator.clipboard.writeText with the description text')
  it.todo('copy button label changes to "Copied!" immediately after click')
  it.todo('regenerate button is visible and labelled "Regenerate"')
})
