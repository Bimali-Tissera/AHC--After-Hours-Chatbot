'use client'

import type { Lead } from '@/lib/supabase/types'

interface KpiCardsProps {
  leads: Lead[]
}

const cards = [
  {
    key: 'new' as const,
    label: 'New Leads',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    ),
    iconBg: '#F0FDF4',
    accent: '#10B981',
  },
  {
    key: 'contacted' as const,
    label: 'Contacted',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
      </svg>
    ),
    iconBg: '#FFF7ED',
    accent: '#F97316',
  },
  {
    key: 'booked' as const,
    label: 'Booked',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M9 16l2 2 4-4"/>
      </svg>
    ),
    iconBg: '#EFF6FF',
    accent: '#3B82F6',
  },
  {
    key: 'total' as const,
    label: 'Total Leads',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    iconBg: '#EEF2FF',
    accent: '#1B3A6B',
  },
]

export default function KpiCards({ leads }: KpiCardsProps) {
  const counts = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    booked: leads.filter(l => l.status === 'booked').length,
    total: leads.length,
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map(card => (
        <div
          key={card.key}
          className="bg-white rounded-xl border border-ekwa-border p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
        >
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: card.iconBg }}
          >
            {card.icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-ekwa-ink leading-none">
              {counts[card.key]}
            </p>
            <p className="text-xs font-medium text-ekwa-muted mt-1">
              {card.label}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
