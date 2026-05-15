'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Company, Payment } from '@/lib/types'
import { getPaymentStatus, formatCurrency, formatDate } from '@/lib/utils'
import { Building2, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface CompanyReportProps {
  companies: Company[]
}

interface CompanySummary {
  company: Company
  total: number
  paid: number
  pending: number
  overdue: number
  count: number
  prevTotal: number
}

export function CompanyReport({ companies }: CompanyReportProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [summaries, setSummaries] = useState<CompanySummary[]>([])
  const [searched, setSearched] = useState(false)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))

  const handleGenerate = async () => {
    setLoading(true)
    const selectedDate = new Date(month + '-01')
    const from = startOfMonth(selectedDate).toISOString().split('T')[0]
    const to = endOfMonth(selectedDate).toISOString().split('T')[0]

    const prevDate = subMonths(selectedDate, 1)
    const prevFrom = startOfMonth(prevDate).toISOString().split('T')[0]
    const prevTo = endOfMonth(prevDate).toISOString().split('T')[0]

    const { data } = await supabase
      .from('payments')
      .select('*, company:companies(id, name, cnpj)')

    const payments = (data || []).map(p => ({
      ...p,
      status: getPaymentStatus(p.due_date, p.paid_at),
    }))

    // Apenas pagamentos PAGOS no mês selecionado (pela data de pagamento)
    const current = payments.filter(p =>
      p.payment_date && p.payment_date >= from && p.payment_date <= to
    )
    // Mês anterior para comparativo
    const previous = payments.filter(p =>
      p.payment_date && p.payment_date >= prevFrom && p.payment_date <= prevTo
    )

    const result: CompanySummary[] = companies.map(company => {
      const cp = current.filter(p => p.company_id === company.id)
      const pp = previous.filter(p => p.company_id === company.id)
      return {
        company,
        total: cp.reduce((s, p) => s + p.value, 0),
        paid: cp.filter(p => p.status === 'paid').reduce((s, p) => s + p.value, 0),
        pending: cp.filter(p => p.status === 'pending').reduce((s, p) => s + p.value, 0),
        overdue: cp.filter(p => p.status === 'overdue').reduce((s, p) => s + p.value, 0),
        count: cp.length,
        prevTotal: pp.reduce((s, p) => s + p.value, 0),
      }
    }).filter(s => s.total > 0 || s.prevTotal > 0)
      .sort((a, b) => b.total - a.total)

    setSummaries(result)
    setSearched(true)
    setLoading(false)
  }

  const monthLabel = format(new Date(month + '-01'), 'MMMM yyyy', { locale: ptBR })
  const prevLabel = format(subMonths(new Date(month + '-01'), 1), 'MMMM yyyy', { locale: ptBR })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <Building2 className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Relatório por Empresa</h3>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mês de referência</label>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <Building2 className="w-4 h-4" />}
            Gerar
          </button>
        </div>

        {searched && (
          summaries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum dado encontrado para este mês</p>
          ) : (
            <div className="space-y-3">
      <p className="text-xs text-slate-400">
        Contas <span className="text-emerald-500 font-medium">pagas</span> em <span className="font-medium text-slate-600 dark:text-slate-300 capitalize">{monthLabel}</span> vs <span className="capitalize">{prevLabel}</span>
      </p>
              {summaries.map(s => {
                const diff = s.prevTotal > 0 ? ((s.total - s.prevTotal) / s.prevTotal) * 100 : null
                return (
                  <div key={s.company.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{s.company.name}</span>
                        <span className="text-xs text-slate-400">{s.count} pag.</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {diff !== null && (
                          <span className={`flex items-center gap-1 text-xs font-medium ${diff > 0 ? 'text-red-500' : diff < 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {Math.abs(diff).toFixed(1)}%
                          </span>
                        )}
                        <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(s.total)}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Pagos', value: s.paid, color: 'text-emerald-500' },
                        { label: 'A Pagar', value: s.pending, color: 'text-amber-500' },
                        { label: 'Atrasados', value: s.overdue, color: 'text-red-500' },
                      ].map(item => (
                        <div key={item.label} className="text-center">
                          <p className="text-xs text-slate-400">{item.label}</p>
                          <p className={`text-sm font-semibold ${item.color}`}>{formatCurrency(item.value)}</p>
                        </div>
                      ))}
                    </div>
                    {s.prevTotal > 0 && (
                      <p className="text-xs text-slate-400 mt-2 text-right capitalize">Mês anterior: {formatCurrency(s.prevTotal)}</p>
                    )}
                  </div>
                )
              })}

              {/* Total */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Geral</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{formatCurrency(summaries.reduce((s, c) => s + c.total, 0))}</span>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  )
}
