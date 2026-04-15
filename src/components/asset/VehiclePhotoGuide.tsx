'use client'

import { useState } from 'react'
import { Camera, ChevronDown } from 'lucide-react'

const tips = [
  'Build plate / door jamb (VIN, compliance)',
  'Front and rear registration plates',
  'Odometer / instrument cluster',
  'All 4 corners exterior (walkaround)',
  'Close-up of any damage (dents, scratches, rust)',
  'Each tyre (showing tread)',
  'Interior: dashboard, seats, rear seats',
  'Engine bay (if accessible)',
  'Boot / tray / cargo area',
]

export function VehiclePhotoGuide() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mb-4 rounded-md border border-white/[0.08] bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <Camera className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="flex-1 text-xs font-medium text-white/70">
          Photo tips for best results
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul className="px-3 pb-3 space-y-1">
          {tips.map((tip) => (
            <li key={tip} className="text-xs text-white/50 flex items-start gap-1.5">
              <span className="text-emerald-500/60 mt-px">&#8226;</span>
              {tip}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
