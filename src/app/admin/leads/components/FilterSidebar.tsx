'use client'

import { useState } from 'react'
import type { LeadStatus } from '@/lib/supabase/types'

export interface Filters {
  search: string
  statuses: LeadStatus[]
  dateRange: 'today' | '7d' | '30d' | 'all'
  exported: 'all' | 'exported' | 'not_exported'
}

interface FilterSidebarProps {
  filters: Filters
  onChange: (filters: Filters) => void
  totalCount: number
  filteredCount: number
}

const statusOptions: { value: LeadStatus; label: string; dot: string }[] = [
  { value: 'new',       label: 'New',       dot: '#10B981' },
  { value: 'contacted', label: 'Contacted', dot: '#F97316' },
  { value: 'booked',    label: 'Booked',    dot: '#3B82F6' },
  { value: 'lost',      label: 'Lost',      dot: '#9CA3AF' },
]

const dateOptions: { value: Filters['dateRange']; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: '7d',    label: 'Last 7 days' },
  { value: '30d',   label: 'Last 30 days' },
  { value: 'all',   label: 'All time' },
]

export default function FilterSidebar({ filters, onChange, totalCount, filteredCount }: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleStatus = (status: LeadStatus) => {
    const current = filters.statuses
    const next = current.includes(status)
      ? current.filter(s => s !== status)
      : [...current, status]
    onChange({ ...filters, statuses: next })
  }

  const clearAll = () => {
    onChange({ search: '', statuses: [], dateRange: 'all', exported: 'all' })
  }

  const hasActiveFilters = filters.search || filters.statuses.length > 0 || filters.dateRange !== 'all' || filters.exported !== 'all'

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden mb-4 flex items-center gap-2 text-sm font-semibold text-ekwa-navy bg-white border border-ekwa-border rounded-lg px-4 py-2.5"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="10" y2="18"/>
        </svg>
        Filters
        {hasActiveFilters && (
          <span className="w-5 h-5 rounded-full bg-ekwa-navy text-white text-[10px] font-bold flex items-center justify-center">
            {filters.statuses.length + (filters.dateRange !== 'all' ? 1 : 0) + (filters.exported !== 'all' ? 1 : 0) + (filters.search ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Sidebar */}
      <div className={`bg-white border-r border-ekwa-border p-5 w-full lg:w-[220px] flex-shrink-0 rounded-xl lg:rounded-none lg:border-r lg:border-t-0 lg:border-b-0 lg:border-l-0 ${isOpen ? 'block' : 'hidden lg:block'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-bold text-ekwa-ink">Filters</h3>
          <span className="text-[11px] text-ekwa-light">
            {filteredCount} of {totalCount}
          </span>
        </div>

        {/* Search */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider mb-2 block">
            Search
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ekwa-light" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Name, phone, email..."
              value={filters.search}
              onChange={e => onChange({ ...filters, search: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-sm text-ekwa-ink bg-ekwa-bg border border-ekwa-border rounded-lg placeholder:text-ekwa-light focus:outline-none focus:border-ekwa-navy focus:ring-1 focus:ring-ekwa-navy/20 transition-colors"
            />
          </div>
        </div>

        {/* Status */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider mb-2 block">
            Status
          </label>
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map(opt => {
              const active = filters.statuses.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  onClick={() => toggleStatus(opt.value)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-ekwa-navy text-white border-ekwa-navy'
                      : 'bg-ekwa-bg text-ekwa-muted border-ekwa-border hover:border-ekwa-navy/30'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: active ? '#fff' : opt.dot }}
                  />
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date Range */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider mb-2 block">
            Date Range
          </label>
          <div className="space-y-1">
            {dateOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...filters, dateRange: opt.value })}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  filters.dateRange === opt.value
                    ? 'bg-ekwa-navy text-white'
                    : 'text-ekwa-muted hover:bg-ekwa-bg'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export Status */}
        <div className="mb-5">
          <label className="text-[11px] font-semibold text-ekwa-muted uppercase tracking-wider mb-2 block">
            Export Status
          </label>
          <select
            value={filters.exported}
            onChange={e => onChange({ ...filters, exported: e.target.value as Filters['exported'] })}
            className="w-full px-3 py-2 text-xs text-ekwa-ink bg-ekwa-bg border border-ekwa-border rounded-lg focus:outline-none focus:border-ekwa-navy transition-colors"
          >
            <option value="all">All</option>
            <option value="exported">Exported</option>
            <option value="not_exported">Not Exported</option>
          </select>
        </div>

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="w-full text-center py-2 text-xs font-semibold text-ekwa-navy hover:bg-ekwa-bg rounded-lg transition-colors"
          >
            Clear All Filters
          </button>
        )}
      </div>
    </>
  )
}
