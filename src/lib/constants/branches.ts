export const BRANCHES = [
  { key: 'brisbane',   label: 'Brisbane (QLD)' },
  { key: 'roma',       label: 'Roma (QLD)' },
  { key: 'mackay',     label: 'Mackay (QLD)' },
  { key: 'newcastle',  label: 'Newcastle (NSW)' },
  { key: 'sydney',     label: 'Sydney (NSW)' },
  { key: 'canberra',   label: 'Canberra (ACT)' },
  { key: 'melbourne',  label: 'Melbourne (VIC)' },
  { key: 'perth',      label: 'Perth (WA)' },
  { key: 'adelaide',   label: 'Adelaide (SA)' },
  { key: 'karratha',   label: 'Karratha (WA)' },
] as const

export type BranchKey = (typeof BRANCHES)[number]['key']
