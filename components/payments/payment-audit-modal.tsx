'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { formatDateTime } from '@/lib/utils'
import { History, Clock } from 'lucide-react'

interface AuditEntry {
  id: string
  action: string
  changes: Record<string, unknown>
  created_at: string
}

interface PaymentAuditModalProps {
  paymentId: string
  paymentDesc: string
  open: boolean
  onClose: () => void
}

export function PaymentAuditModal({ paymentId, paymentDesc, open, onClose }: PaymentAuditModalProps) {
  const supabase = createClient()
  const [audits, setAudits] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    supabase
      .from('payment_audits')
      .select('*')
      .eq('payment_id', paymentId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setAudits(data || [])
        setLoading(false)
      })
  }, [open, paymentId])

  const actionLabel: Record<string, string> = {
    update: 'Correção realizada',
    create: 'Pagamento cadastrado',
  }

  return (
    <Modal open={open} onClose={onClose} title="Histórico de Alterações" size="md">
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{paymentDesc}</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : audits.length === 0 ? (
          <div className="text-center py-10">
            <History className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhuma alteração registrada</p>
          </div>
        ) : (
          <div className="space-y-2">
            {audits.map(audit => (
              <div key={audit.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {actionLabel[audit.action] || audit.action}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(audit.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
