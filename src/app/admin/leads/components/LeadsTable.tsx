'use client'

import { useState, useRef, useEffect } from 'react'
import type { Lead, LeadStatus } from '@/lib/supabase/types'
import StatusBadge from './StatusBadge'

interface LeadsTableProps {
  leads: Lead[]
  onStatusChange: (leadId: string, status: LeadStatus) => void
}

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: 'new',       label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'booked',    label: 'Booked' },
  { value: 'lost',      label: 'Lost' },
]

function StatusDropdown({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: string, s: LeadStatus) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="cursor-pointer">
        <StatusBadge status={lead.status} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-ekwa-border rounded-lg shadow-lg py-1 z-20 min-w-[120px]">
          {statusOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onStatusChange(lead.id, opt.value)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-1.5 text-xs transition-colors ${
                lead.status === opt.value
                  ? 'font-semibold text-ekwa-navy bg-ekwa-bg'
                  : 'text-ekwa-muted hover:bg-ekwa-bg'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LeadsTable({ leads, onStatusChange }: LeadsTableProps) {
  if (leads.length === 0) {
    return (
      <div className="bg-white rounded-t-xl border border-ekwa-border">
        <div className="px-6 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-ekwa-bg flex items-center justify-center mx-auto mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="11" x2="19" y2="17"/>
              <line x1="22" y1="14" x2="16" y2="14"/>
            </svg>
          </div>
          <p className="text-sm font-semibold text-ekwa-ink">No leads found</p>
          <p className="text-xs text-ekwa-muted mt-1">
            Try adjusting your filters, or leads will appear here once patients start chatting after hours.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-t-xl border border-ekwa-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-ekwa-bg/60">
              <th className="text-left text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider px-5 py-3.5" style={{ width: '18%' }}>
                Name
              </th>
              <th className="text-left text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider px-5 py-3.5" style={{ width: '14%' }}>
                Phone
              </th>
              <th className="text-left text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider px-5 py-3.5" style={{ width: '18%' }}>
                Email
              </th>
              <th className="text-left text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider px-5 py-3.5" style={{ width: '10%' }}>
                Status
              </th>
              <th className="text-left text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider px-5 py-3.5" style={{ width: '26%' }}>
                Trigger Question
              </th>
              <th className="text-left text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider px-5 py-3.5" style={{ width: '14%' }}>
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const missingInfo = !lead.phone && !lead.email
              return (
                <tr
                  key={lead.id}
                  className="border-t border-ekwa-border/60 hover:bg-ekwa-bg/40 transition-colors"
                >
                  {/* Name */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-ekwa-bg flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-ekwa-navy">
                          {lead.name?.[0]?.toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ekwa-ink truncate">
                          {lead.name ?? '—'}
                        </p>
                        {missingInfo && (
                          <p className="text-[10px] text-ekwa-orange flex items-center gap-1 mt-0.5">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            Missing contact info
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="px-5 py-3.5 text-sm text-ekwa-ink">
                    {lead.phone ?? <span className="text-ekwa-light">—</span>}
                  </td>

                  {/* Email */}
                  <td className="px-5 py-3.5 text-sm text-ekwa-ink truncate max-w-[200px]">
                    {lead.email ?? <span className="text-ekwa-light">—</span>}
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5">
                    <StatusDropdown lead={lead} onStatusChange={onStatusChange} />
                  </td>

                  {/* Trigger Question */}
                  <td className="px-5 py-3.5 text-sm text-ekwa-muted">
                    <p className="truncate max-w-[280px]" title={lead.trigger_question ?? undefined}>
                      {lead.trigger_question ?? <span className="text-ekwa-light">—</span>}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 text-sm text-ekwa-muted">
                    {new Date(lead.captured_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
