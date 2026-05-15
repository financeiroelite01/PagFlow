'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Payment, Company, PaymentFilters, PaymentStatus } from '@/lib/types'
import { getPaymentStatus, formatCurrency, formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'
import { PaymentForm } from '@/components/payments/payment-form'
import { PaymentAuditModal } from '@/components/payments/payment-audit-modal'
import { Pencil, Trash2, Plus, Search, X, ChevronDown, ChevronUp, FileText, Receipt, Landmark, History } from 'lucide-react'

interface PaymentsTableProps {
  tab: 'all' | PaymentStatus
  companies: Company[]
}

export function PaymentsTable({ tab, companies }: PaymentsTableProps) {
  const supabase = createClient()
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [editPayment, setEditPayment] = useState<Payment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [auditPayment, setAuditPayment] = useState<Payment | null>(null)
  const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'due_date', dir: 'asc' })
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 15
  const [filters, setFilters] = useState<PaymentFilters>({
    search: '', company_id: '', category: '', date_from: '', date_to: ''
  })

  const loadPayments = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('payments')
      .select('*, company:companies(id, name, cnpj)')
      .order(sort.field, { ascending: sort.dir === 'asc' })

    if (!error && data) {
      let filtered = data.map(p => ({
        ...p,
        status: getPaymentStatus(p.due_date, p.paid_at) as PaymentStatus,
      })).filter(p => tab === 'all' || p.status === tab)

      if (filters.search) {
        const s = filters.search.toLowerCase()
        filtered = filtered.filter(p =>
          p.description?.toLowerCase().includes(s) ||
          p.reference?.toLowerCase().includes(s) ||
          p.recipient?.toLowerCase().includes(s) ||
          p.company?.name?.toLowerCase().includes(s)
        )
      }
      if (filters.company_id) filtered = filtered.filter(p => p.company_id === filters.company_id)
      if (filters.category) filtered = filtered.filter(p => p.category === filters.category)
      if (filters.date_from) filtered = filtered.filter(p => p.due_date >= filters.date_from!)
      if (filters.date_to) filtered = filtered.filter(p => p.due_date <= filters.date_to!)

      setPayments(filtered)
      setPage(1)
    }
    setLoading(false)
  }, [tab, sort, filters])

  useEffect(() => { loadPayments() }, [loadPayments])

  const handleDelete = async () => {
    if (!deleteId) return
    await supabase.from('payments').delete().eq('id', deleteId)
    setDeleteId(null)
    loadPayments()
  }

  const toggleSort = (field: string) => {
    setSort(prev => prev.field === field
      ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
      : { field, dir: 'asc' }
    )
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sort.field !== field) return null
    return sort.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const totalPages = Math.ceil(payments.length / PAGE_SIZE)
  const paginated = payments.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const clearFilters = () => { setFilters({ search: '', company_id: '', category: '', date_from: '', date_to: '' }); setPage(1) }
  const hasFilters = Object.values(filters).some(Boolean)

  const CATEGORIES = ['Aluguel', 'Energia', 'Água', 'Internet', 'Telefone', 'Fornecedor', 'Salário', 'Impostos', 'Serviços', 'Outros']

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="col-span-2 md:col-span-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Buscar..."
              value={filters.search}
              onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            />
          </div>

          <select
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.company_id}
            onChange={e => setFilters(p => ({ ...p, company_id: e.target.value }))}
          >
            <option value="">Todas empresas</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.category}
            onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}
          >
            <option value="">Categorias</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <input type="date" className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.date_from} onChange={e => setFilters(p => ({ ...p, date_from: e.target.value }))} placeholder="De" />

          <input type="date" className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={filters.date_to} onChange={e => setFilters(p => ({ ...p, date_to: e.target.value }))} placeholder="Até" />
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="mt-2 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>

      {/* Action row */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {payments.length} {payments.length === 1 ? 'registro' : 'registros'}
        </p>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Novo Pagamento
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                {[
                  { label: 'Vencimento', field: 'due_date' },
                  { label: 'Empresa', field: 'company_id' },
                  { label: 'Descrição', field: 'description' },
                  { label: 'Referência', field: 'reference' },
                  { label: 'Beneficiário', field: 'recipient' },
                  { label: 'Categoria', field: 'category' },
                  { label: 'Valor', field: 'value' },
                  { label: 'Pgto', field: 'payment_date' },
                  { label: 'Cadastro', field: 'created_at' },
                  { label: 'Status', field: 'status' },
                ].map(col => (
                  <th
                    key={col.field}
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 whitespace-nowrap"
                    onClick={() => toggleSort(col.field)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label} <SortIcon field={col.field} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Anexos</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 12 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                paginated.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">{formatDate(p.due_date)}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{p.company?.name || '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">{p.description}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.reference}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{p.recipient || '-'}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.category || '-'}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{formatCurrency(p.value)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{formatDate(p.payment_date)}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status!} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {p.nf_url && (
                          <a href={p.nf_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Ver Nota Fiscal">
                            <FileText className="w-4 h-4" />
                          </a>
                        )}
                        {p.boleto_url && (
                          <a href={p.boleto_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all" title="Ver Boleto">
                            <Landmark className="w-4 h-4" />
                          </a>
                        )}
                        {p.receipt_url && (
                          <a href={p.receipt_url} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all" title="Ver Comprovante">
                            <Receipt className="w-4 h-4" />
                          </a>
                        )}
                        {!p.nf_url && !p.boleto_url && !p.receipt_url && <span className="text-xs text-slate-300 dark:text-slate-600 px-1">—</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditPayment(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all" title="Corrigir">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setAuditPayment(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all" title="Histórico">
                          <History className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        {payments.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex justify-end">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Total: {formatCurrency(payments.reduce((s, p) => s + p.value, 0))}
            </p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Página {page} de {totalPages} · {payments.length} registros
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Anterior
            </button>
            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              const p = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 text-xs rounded-lg border transition-all ${page === p ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Próxima →
            </button>
          </div>
        </div>
      )}

      {/* New Payment Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Novo Pagamento" size="lg">
        <PaymentForm companies={companies} onSuccess={() => { setShowForm(false); loadPayments() }} onCancel={() => setShowForm(false)} />
      </Modal>

      {/* Edit Payment Modal */}
      <Modal open={!!editPayment} onClose={() => setEditPayment(null)} title="Corrigir Pagamento" size="lg">
        {editPayment && (
          <PaymentForm payment={editPayment} companies={companies} onSuccess={() => { setEditPayment(null); loadPayments() }} onCancel={() => setEditPayment(null)} />
        )}
      </Modal>

      {/* Audit Modal */}
      {auditPayment && (
        <PaymentAuditModal
          paymentId={auditPayment.id}
          paymentDesc={auditPayment.description}
          open={!!auditPayment}
          onClose={() => setAuditPayment(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Excluir Pagamento" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">Tem certeza que deseja excluir este pagamento? Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
