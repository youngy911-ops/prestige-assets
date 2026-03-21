import { getFieldsSortedBySfOrder } from '@/lib/schema-registry'
import type { AssetType } from '@/lib/schema-registry/types'

/**
 * Generates the structured Salesforce fields block for copy-paste.
 *
 * - Every field from the Schema Registry is included in sfOrder order.
 * - Fields with null/undefined/empty values are shown as "Label: " (blank, not omitted).
 *   Rationale: Salesforce operators paste the entire block — missing labels break their workflow.
 * - Format: "{Salesforce Label}: {value}" joined with "\n" (no trailing newline).
 */
export function generateFieldsBlock(
  assetType: AssetType,
  fields: Record<string, string>
): string {
  const sortedFields = getFieldsSortedBySfOrder(assetType)
  return sortedFields
    .map(f => `${f.label}: ${fields[f.key] ?? ''}`)
    .join('\n')
}
