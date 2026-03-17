import { describe, it, expect } from 'vitest'
import { BRANCHES } from '@/lib/constants/branches'
import fs from 'fs'
import path from 'path'

describe('BRANCHES constant', () => {
  it('has exactly 10 branches', () => {
    expect(BRANCHES).toHaveLength(10)
  })

  it('every branch has a key (lowercase, no spaces) and a label', () => {
    for (const branch of BRANCHES) {
      expect(branch.key).toMatch(/^[a-z]+$/)
      expect(branch.label.length).toBeGreaterThan(0)
    }
  })

  it('all branch keys are unique', () => {
    const keys = BRANCHES.map(b => b.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('DB migration SQL', () => {
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260317000001_initial_schema.sql')

  it('migration file exists', () => {
    expect(fs.existsSync(migrationPath)).toBe(true)
  })

  it('assets table has RLS enabled', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    expect(sql).toContain('alter table public.assets enable row level security')
  })

  it('asset_photos table has RLS enabled', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    expect(sql).toContain('alter table public.asset_photos enable row level security')
  })

  it('assets RLS policy restricts to auth.uid() = user_id', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    expect(sql).toContain('auth.uid() = user_id')
  })

  it('assets table has fields column with jsonb type', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    expect(sql).toContain('fields        jsonb')
  })
})
