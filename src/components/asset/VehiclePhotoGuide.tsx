'use client'

import { useState } from 'react'
import { Camera, ChevronDown } from 'lucide-react'

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
          More photos = better results
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <p className="px-3 pb-3 text-xs text-white/45 leading-relaxed">
          Exterior walkaround (all four sides + rear), interior (seats, carpet, dash), odometer, build plate, tyres, any damage close-ups. Interior shots are needed for seat and carpet condition ratings.
        </p>
      )}
    </div>
  )
}
