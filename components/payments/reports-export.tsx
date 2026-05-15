'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Company, Payment, PaymentFilters } from '@/lib/types'
import { getPaymentStatus, formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'

interface ReportsPageProps {
  companies: Company[]
}

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pago',
  overdue: 'Atrasado',
  pending: 'A Pagar',
}

const CATEGORIES = ['Aluguel', 'Energia', 'Água', 'Internet', 'Telefone', 'Fornecedor', 'Salário', 'Impostos', 'Serviços', 'Outros']

export function ReportsExport({ companies }: ReportsPageProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<Payment[]>([])
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState<PaymentFilters & { status?: string }>({
    search: '', company_id: '', category: '', date_from: '', date_to: '', status: ''
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select('*, company:companies(id, name, cnpj)')
      .order('due_date', { ascending: false })

    if (!error && data) {
      let filtered = data.map(p => ({
        ...p,
        status: getPaymentStatus(p.due_date, p.paid_at),
      }))

      if (filters.search) {
        const s = filters.search.toLowerCase()
        filtered = filtered.filter(p =>
          p.description?.toLowerCase().includes(s) ||
          p.reference?.toLowerCase().includes(s) ||
          p.company?.name?.toLowerCase().includes(s)
        )
      }
      if (filters.company_id) filtered = filtered.filter(p => p.company_id === filters.company_id)
      if (filters.category) filtered = filtered.filter(p => p.category === filters.category)
      if (filters.status) filtered = filtered.filter(p => p.status === filters.status)
      if (filters.date_from) filtered = filtered.filter(p => p.due_date >= filters.date_from!)
      if (filters.date_to) filtered = filtered.filter(p => p.due_date <= filters.date_to!)

      setPreview(filtered as Payment[])
      setSearched(true)
    }
    setLoading(false)
  }, [filters])

  const exportExcel = () => {
    if (preview.length === 0) return

    const rows = preview.map(p => ({
      'Data do Pagamento': p.payment_date ? formatDate(p.payment_date) : '-',
      'Data de Vencimento': formatDate(p.due_date),
      'Referência': p.reference,
      'Descrição': p.description,
      'Valor': p.value,
      'Empresa Pagante': (p as any).company?.name || '-',
      'Categoria': p.category || '-',
      'Status': STATUS_LABELS[p.status || 'pending'] || '-',
      'Observações': p.notes || '-',
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()

    // Column widths
    ws['!cols'] = [
      { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 35 },
      { wch: 14 }, { wch: 30 }, { wch: 15 }, { wch: 12 }, { wch: 25 },
    ]

    // Total row
    const totalRow = preview.reduce((s, p) => s + p.value, 0)
    XLSX.utils.sheet_add_aoa(ws, [
      ['', '', '', 'TOTAL:', totalRow, '', '', '', '']
    ], { origin: -1 })

    XLSX.utils.book_append_sheet(wb, ws, 'Pagamentos')

    const date = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    XLSX.writeFile(wb, `pagflow-relatorio-${date}.xlsx`)
  }

  const clearFilters = () => {
    setFilters({ search: '', company_id: '', category: '', date_from: '', date_to: '', status: '' })
    setPreview([])
    setSearched(false)
  }

  const hasFilters = Object.values(filters).some(Boolean)
  const total = preview.reduce((s, p) => s + p.value, 0)

  return (
    <div className="space-y-6">
      {/* Filter card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Filtrar Relatório</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              placeholder="Buscar..." value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} />
          </div>

          <select className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.company_id} onChange={e => setFilters(p => ({ ...p, company_id: e.target.value }))}>
            <option value="">Todas empresas</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
            <option value="">Todos os status</option>
            <option value="pending">A Pagar</option>
            <option value="paid">Pagos</option>
            <option value="overdue">Atrasados</option>
          </select>

          <select className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}>
            <option value="">Categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <div className="flex gap-2 items-center">
            <input type="date" className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filters.date_from} onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} />
            <span className="text-slate-400 text-xs">até</span>
            <input type="date" className="flex-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={filters.date_to} onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} />
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <Button onClick={fetchData} loading={loading}>
            <Search className="w-4 h-4" /> Gerar Relatório
          </Button>
          {hasFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4" /> Limpar
            </Button>
          )}
          {preview.length > 0 && (
            <Button variant="secondary" onClick={exportExcel} className="ml-auto">
              <Download className="w-4 h-4" /> Exportar Excel
            </Button>
          )}
        </div>
      </div>

      {/* Preview table */}
      {searched && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {preview.length} {preview.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            {preview.length > 0 && (
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Total: {formatCurrency(total)}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  {['Data Pagamento', 'Referência', 'Valor', 'Empresa Pagante', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {preview.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-10 text-slate-400">Nenhum dado encontrado</td></tr>
                ) : (
                  preview.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatDate(p.payment_date)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{p.reference}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{formatCurrency(p.value)}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{(p as any).company?.name || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          p.status === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {STATUS_LABELS[p.status || 'pending']}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
