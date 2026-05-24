export type LeadStatus = 'new' | 'contacted' | 'booked' | 'lost'

export interface Lead {
  id: string
  chat_id: string | null
  practice_id: string | null
  name: string | null
  phone: string | null
  email: string | null
  trigger_question: string | null
  captured_at: string
  exported: boolean
  status: LeadStatus
}
