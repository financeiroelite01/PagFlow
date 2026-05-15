'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, formatDate, getPaymentStatus } from '@/lib/utils'
import { AlertTriangle, X, Bell } from 'lucide-react'

interface DueSoonPayment {
  id: string
  description: string
  value: number
  due_date: string
  company_name: string
}

export function DueSoonPopup() {
  const [payments, setPayments] = useState<DueSoonPayment[]>([])
  const [visible, setVisible] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    // Only show once per browser session
    const alreadyShown = sessionStorage.getItem('pagflow_due_popup_shown')
    if (alreadyShown) return

    const checkDueSoon = async () => {
      const today = new Date()
      const in3Days = new Date()
      in3Days.setDate(today.getDate() + 3)

      const todayStr = today.toISOString().split('T')[0]
      const in3DaysStr = in3Days.toISOString().split('T')[0]

      const { data } = await supabase
        .from('payments')
        .select('id, description, value, due_date, paid_at, company:companies(name)')
        .gte('due_date', todayStr)
        .lte('due_date', in3DaysStr)
        .is('paid_at', null)
        .order('due_date', { ascending: true })

      if (data && data.length > 0) {
        const mapped: DueSoonPayment[] = data.map((p: any) => ({
          id: p.id,
          description: p.description,
          value: p.value,
          due_date: p.due_date,
          company_name: p.company?.name || '-',
        }))
        setPayments(mapped)
        setVisible(true)
        sessionStorage.setItem('pagflow_due_popup_shown', '1')
      }
    }

    checkDueSoon()
  }, [])

  if (!visible || payments.length === 0) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setVisible(false)}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/30 px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              {payments.length === 1
                ? '1 pagamento vence nos próximos 3 dias!'
                : `${payments.length} pagamentos vencem nos próximos 3 dias!`}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Fique atento aos vencimentos abaixo</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
          {payments.map(p => {
            const dueDate = new Date(p.due_date + 'T12:00:00')
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const diffDays = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

            return (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
              >
                <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.description}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{p.company_name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(p.value)}</p>
                  <p className={`text-xs font-medium ${diffDays === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                    {diffDays === 0 ? 'Vence hoje!' : `em ${diffDays} dia${diffDays > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <button
            onClick={() => setVisible(false)}
            className="w-full bg-amber-500 hover:bg-amber-400 text-white font-medium py-2.5 rounded-xl text-sm transition-all duration-150"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}
