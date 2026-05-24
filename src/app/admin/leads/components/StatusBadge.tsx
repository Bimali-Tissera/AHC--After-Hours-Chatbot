'use client'

import type { LeadStatus } from '@/lib/supabase/types'

const config: Record<LeadStatus, { label: string; bg: string; text: string; dot: string }> = {
  new:       { label: 'New',       bg: '#F0FDF4', text: '#059669', dot: '#10B981' },
  contacted: { label: 'Contacted', bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  booked:    { label: 'Booked',    bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  lost:      { label: 'Lost',      bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
}

export default function StatusBadge({ status }: { status: LeadStatus }) {
  const c = config[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: c.dot }}
      />
      {c.label}
    </span>
  )
}
