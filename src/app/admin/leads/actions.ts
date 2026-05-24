'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { LeadStatus } from '@/lib/supabase/types'
import { revalidatePath } from 'next/cache'

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)

  if (error) {
    throw new Error(`Failed to update lead status: ${error.message}`)
  }

  revalidatePath('/admin/leads')
}
