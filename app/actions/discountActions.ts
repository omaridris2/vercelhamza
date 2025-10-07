'use server'

import { supabase } from '@/lib/supabaseClient'

type DiscountCodeData = {
  id: string
  code: string
  type: string
  mode: string
  amount: number
  expiration_date: string
  use_limit: number
}

export async function createDiscountCode(data: DiscountCodeData) {
  // Check if code already exists
  const { data: existing, error: selectError } = await supabase
    .from('discount_codes')
    .select('code')
    .eq('code', data.code)
    .maybeSingle()

  if (selectError) throw selectError
  if (existing) throw new Error('Code already exists')

  // Insert if unique
  const { error } = await supabase.from('discount_codes').insert([
    {
      id: data.id,
      code: data.code,
      type: data.type,
      mode: data.mode,
      amount: data.amount,
      expiration_date: data.expiration_date,
      use_limit: data.use_limit,
    },
  ])

  if (error) throw error
  return { success: true }
}
