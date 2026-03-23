/**
 * Parses the structured key: value lines from an inspection_notes string.
 * The 'Notes' key (freeform textarea) is excluded from the result.
 */
export function parseStructuredFields(notes: string | null): Record<string, string> {
  if (!notes) return {}
  const result: Record<string, string> = {}
  for (const line of notes.split('\n')) {
    const colonIdx = line.indexOf(': ')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    const value = line.slice(colonIdx + 2).trim()
    // 'Notes' is the freeform textarea key — not a structured field
    if (key === 'Notes' || !key || !value) continue
    result[key] = value
  }
  return result
}

/**
 * Extracts the freeform notes text from the "Notes: " line in an inspection_notes string.
 * Returns '' if no Notes line is present or if notes is null/empty.
 */
export function extractFreeformNotes(notes: string | null): string {
  if (!notes) return ''
  const lines = notes.split('\n')
  const notesIdx = lines.findIndex((l) => l.startsWith('Notes: '))
  if (notesIdx === -1) return ''
  const firstLine = lines[notesIdx].slice('Notes: '.length)
  const rest = lines.slice(notesIdx + 1)
  return [firstLine, ...rest].join('\n').trimEnd()
}
