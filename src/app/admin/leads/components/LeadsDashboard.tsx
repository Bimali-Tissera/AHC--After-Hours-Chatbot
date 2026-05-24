'use client'

import { useState, useMemo, useTransition } from 'react'
import type { Lead, LeadStatus } from '@/lib/supabase/types'
import KpiCards from './KpiCards'
import FilterSidebar, { type Filters } from './FilterSidebar'
import LeadsTable from './LeadsTable'
import Pagination from './Pagination'
import ExportButton from './ExportButton'
import { updateLeadStatus } from '../actions'

interface LeadsDashboardProps {
  initialLeads: Lead[]
}

export default function LeadsDashboard({ initialLeads }: LeadsDashboardProps) {
  const [leads, setLeads] = useState(initialLeads)
  const [isPending, startTransition] = useTransition()
  const [filters, setFilters] = useState<Filters>({
    search: '',
    statuses: [],
    dateRange: 'all',
    exported: 'all',
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Filter leads
  const filteredLeads = useMemo(() => {
    let result = leads

    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(l =>
        (l.name?.toLowerCase().includes(q)) ||
        (l.phone?.toLowerCase().includes(q)) ||
        (l.email?.toLowerCase().includes(q))
      )
    }

    // Status
    if (filters.statuses.length > 0) {
      result = result.filter(l => filters.statuses.includes(l.status))
    }

    // Date range
    if (filters.dateRange !== 'all') {
      const now = new Date()
      let cutoff: Date
      switch (filters.dateRange) {
        case 'today':
          cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case '7d':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
      result = result.filter(l => new Date(l.captured_at) >= cutoff!)
    }

    // Export status
    if (filters.exported === 'exported') {
      result = result.filter(l => l.exported)
    } else if (filters.exported === 'not_exported') {
      result = result.filter(l => !l.exported)
    }

    return result
  }, [leads, filters])

  // Paginate
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage
    return filteredLeads.slice(start, start + rowsPerPage)
  }, [filteredLeads, currentPage, rowsPerPage])

  // Reset page when filters change
  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  // Status change handler
  const handleStatusChange = (leadId: string, status: LeadStatus) => {
    // Optimistic update
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status } : l))

    startTransition(async () => {
      try {
        await updateLeadStatus(leadId, status)
      } catch {
        // Revert on error
        setLeads(initialLeads)
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ekwa-ink tracking-tight">Leads</h1>
          <p className="text-sm text-ekwa-muted mt-1">
            After-hours patient inquiries captured by your chatbot
          </p>
        </div>
        <ExportButton leads={filteredLeads} />
      </div>

      {/* KPI Cards */}
      <KpiCards leads={leads} />

      {/* Content area: filter flush-left + table */}
      <div className="flex flex-col lg:flex-row gap-0">
        <div className="flex-shrink-0">
          <FilterSidebar
            filters={filters}
            onChange={handleFiltersChange}
            totalCount={leads.length}
            filteredCount={filteredLeads.length}
          />
        </div>

        <div className="flex-1 min-w-0">
          {isPending && (
            <div className="mb-2 text-xs text-ekwa-muted animate-pulse">Updating...</div>
          )}
          <LeadsTable
            leads={paginatedLeads}
            onStatusChange={handleStatusChange}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filteredLeads.length}
            rowsPerPage={rowsPerPage}
            onPageChange={setCurrentPage}
            onRowsPerPageChange={setRowsPerPage}
          />
        </div>
      </div>
    </div>
  )
}
