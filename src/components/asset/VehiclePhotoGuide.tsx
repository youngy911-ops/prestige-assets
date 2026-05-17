'use client'
import { useState } from 'react'
import { Camera, ChevronDown } from 'lucide-react'

const PHOTO_CHECKLIST = [
  'Driver front 3/4',
  'Passenger front 3/4',
  'Driver rear 3/4',
  'Passenger rear 3/4',
  'Odometer',
  'Build plate',
  'Interior — seats',
  'Interior — dash',
  'Engine bay',
  'Any damage close-ups',
]

export function VehiclePhotoGuide() {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4 rounded-xl border border-white/[0.08] bg-white/[0.03]">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <Camera className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span className="flex-1 text-xs font-medium text-white/70">
          More photos = better extraction
        </span>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 flex flex-col gap-2">
          <p className="text-xs text-white/40">Cover these angles for best AI results:</p>
          <div className="flex flex-wrap gap-1.5">
            {PHOTO_CHECKLIST.map(item => (
              <span
                key={item}
                className="inline-flex items-center gap-1 text-xs bg-white/[0.05] border border-white/[0.07] rounded-full px-2.5 py-1 text-white/55"
              >
                <Camera className="w-2.5 h-2.5 text-emerald-400/60 flex-shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
