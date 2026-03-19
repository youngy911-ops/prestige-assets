'use client'
import { Controller } from 'react-hook-form'
import type { Control } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { ConfidenceBadge } from '@/components/asset/ConfidenceBadge'
import type { FieldDefinition } from '@/lib/schema-registry/types'
import type { ConfidenceLevel } from '@/components/asset/ConfidenceBadge'

interface FieldRowProps {
  field: FieldDefinition
  confidence: ConfidenceLevel
  control: Control<Record<string, string>>
  error?: string
}

const HIGHLIGHT_CLASSES: Partial<Record<ConfidenceLevel, string>> = {
  medium: 'border-l-2 border-l-amber-400/40 pl-3',
  low: 'border-l-2 border-l-red-500/40 pl-3',
  not_found: 'border-l-2 border-l-red-500/40 pl-3',
}

const INPUT_BASE = 'h-9 text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 focus:ring-[oklch(0.29_0.07_248)]'

export function FieldRow({ field, confidence, control, error }: FieldRowProps) {
  const highlightClass = HIGHLIGHT_CLASSES[confidence] ?? ''

  return (
    <div className={`flex flex-col gap-2 py-4 ${highlightClass}`}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`field-${field.key}`} className="text-sm text-white/65">
          {field.label}
        </Label>
        <ConfidenceBadge level={confidence} />
      </div>

      <Controller
        name={field.key}
        control={control}
        render={({ field: rhfField }) => {
          if (field.inputType === 'textarea') {
            return (
              <Textarea
                id={`field-${field.key}`}
                className="min-h-[80px] text-sm bg-white/5 border-white/15 text-white placeholder:text-white/30 resize-y"
                {...rhfField}
              />
            )
          }
          if (field.inputType === 'select' && field.options) {
            return (
              <Select
                value={rhfField.value}
                onValueChange={rhfField.onChange}
              >
                <SelectTrigger id={`field-${field.key}`} className={INPUT_BASE}>
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          }
          return (
            <Input
              id={`field-${field.key}`}
              type="text"
              inputMode={field.inputType === 'number' ? 'numeric' : 'text'}
              className={INPUT_BASE}
              {...rhfField}
            />
          )
        }}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
