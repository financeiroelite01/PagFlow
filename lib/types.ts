export interface Company {
  id: string
  name: string
  cnpj: string | null
  user_id: string
  created_at: string
}

export interface Payment {
  id: string
  user_id: string
  company_id: string
  company?: Company
  description: string
  reference: string
  recipient: string | null
  pix_key: string | null
  barcode: string | null
  cost_center: string | null
  is_recurring: boolean
  recurrence_interval: 'weekly' | 'monthly' | 'yearly' | null
  nf_url: string | null
  boleto_url: string | null
  receipt_url: string | null
  value: number
  due_date: string
  paid_at: string | null
  payment_date: string | null
  notes: string | null
  category: string | null
  created_at: string
  updated_at: string
  status?: 'paid' | 'overdue' | 'pending'
}

export interface PaymentFilters {
  search?: string
  company_id?: string
  recipient?: string
  category?: string
  date_from?: string
  date_to?: string
}

export type PaymentStatus = 'paid' | 'overdue' | 'pending'

export interface ExportColumn {
  payment_date: string
  reference: string
  value: string
  company: string
  description: string
  due_date: string
  status: string
}

export interface PaymentAudit {
  id: string
  payment_id: string
  user_id: string
  action: string
  changes: Record<string, { from: unknown; to: unknown }>
  created_at: string
}
