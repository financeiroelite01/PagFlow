'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Company } from '@/lib/types'
import { getPaymentStatus, formatCurrency } from '@/lib/utils'
import { Building2, TrendingUp, TrendingDown, Minus, Download, FileText } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import * as XLSX from 'xlsx'

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
  prevPaid: number
}

// Parse yyyy-MM safely without timezone issues
function parseMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1)
}

function monthRange(date: Date) {
  const from = format(startOfMonth(date), 'yyyy-MM-dd')
  const to = format(endOfMonth(date), 'yyyy-MM-dd')
  return { from, to }
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function CompanyReport({ companies }: CompanyReportProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [summaries, setSummaries] = useState<CompanySummary[]>([])
  const [searched, setSearched] = useState(false)
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [currentMonthLabel, setCurrentMonthLabel] = useState('')
  const [prevMonthLabel, setPrevMonthLabel] = useState('')

  const handleGenerate = async () => {
    setLoading(true)

    const selectedDate = parseMonth(month)
    const prevDate = subMonths(selectedDate, 1)
    const { from, to } = monthRange(selectedDate)
    const { from: prevFrom, to: prevTo } = monthRange(prevDate)

    // Fix labels using the parsed date (no timezone issue)
    setCurrentMonthLabel(capitalize(format(selectedDate, 'MMMM yyyy', { locale: ptBR })))
    setPrevMonthLabel(capitalize(format(prevDate, 'MMMM yyyy', { locale: ptBR })))

    const { data } = await supabase
      .from('payments')
      .select('*, company:companies(id, name, cnpj)')

    const payments = (data || []).map(p => ({
      ...p,
      status: getPaymentStatus(p.due_date, p.paid_at),
    }))

    const current = payments.filter(p =>
      p.payment_date && p.payment_date >= from && p.payment_date <= to
    )
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
        prevPaid: pp.filter(p => p.status === 'paid').reduce((s, p) => s + p.value, 0),
      }
    }).filter(s => s.total > 0 || s.prevTotal > 0)
      .sort((a, b) => b.total - a.total)

    setSummaries(result)
    setSearched(true)
    setLoading(false)
  }

  const exportExcel = () => {
    if (!summaries.length) return
    const rows = summaries.map(s => ({
      'Empresa': s.company.name,
      'CNPJ': s.company.cnpj || '-',
      'Qtd Pagamentos': s.count,
      [`Total ${currentMonthLabel}`]: s.total,
      [`Total ${prevMonthLabel}`]: s.prevTotal,
      'Variação (%)': s.prevTotal > 0 ? `${(((s.total - s.prevTotal) / s.prevTotal) * 100).toFixed(1)}%` : '-',
    }))
    // Add total row
    rows.push({
      'Empresa': 'TOTAL GERAL',
      'CNPJ': '',
      'Qtd Pagamentos': summaries.reduce((s, c) => s + c.count, 0),
      [`Total ${currentMonthLabel}`]: summaries.reduce((s, c) => s + c.total, 0),
      [`Total ${prevMonthLabel}`]: summaries.reduce((s, c) => s + c.prevTotal, 0),
      'Variação (%)': '',
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    ws['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 14 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório por Empresa')
    XLSX.writeFile(wb, `relatorio-empresa-${month}.xlsx`)
  }

  const exportPDF = () => {
    if (!summaries.length) return
    const totalCurrent = summaries.reduce((s, c) => s + c.total, 0)
    const totalPrev = summaries.reduce((s, c) => s + c.prevTotal, 0)

    const rows = summaries.map(s => {
      const diff = s.prevTotal > 0 ? (((s.total - s.prevTotal) / s.prevTotal) * 100).toFixed(1) : '-'
      return `
        <tr>
          <td>${s.company.name}</td>
          <td>${s.company.cnpj || '-'}</td>
          <td style="text-align:center">${s.count}</td>
          <td style="text-align:right">${formatCurrency(s.total)}</td>
          <td style="text-align:right">${s.prevTotal > 0 ? formatCurrency(s.prevTotal) : '-'}</td>
          <td style="text-align:center;color:${diff === '-' ? '#94a3b8' : Number(diff) > 0 ? '#ef4444' : '#10b981'}">${diff !== '-' ? diff + '%' : '-'}</td>
        </tr>`
    }).join('')

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Relatório por Empresa — ${currentMonthLabel}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #1e293b; font-size: 13px; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .sub { color: #64748b; margin-bottom: 24px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
    td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    tr:last-child td { border-bottom: none; }
    .total-row td { font-weight: bold; background: #f8fafc; border-top: 2px solid #e2e8f0; }
    .footer { margin-top: 24px; color: #94a3b8; font-size: 11px; text-align: right; }
  </style>
</head>
<body>
  <h1>Relatório por Empresa — PagFlow</h1>
  <div class="sub">Contas pagas em ${currentMonthLabel} · Comparativo com ${prevMonthLabel}</div>
  <table>
    <thead>
      <tr>
        <th>Empresa</th>
        <th>CNPJ</th>
        <th style="text-align:center">Qtd</th>
        <th style="text-align:right">${currentMonthLabel}</th>
        <th style="text-align:right">${prevMonthLabel}</th>
        <th style="text-align:center">Variação</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      <tr class="total-row">
        <td>TOTAL GERAL</td>
        <td></td>
        <td style="text-align:center">${summaries.reduce((s, c) => s + c.count, 0)}</td>
        <td style="text-align:right">${formatCurrency(totalCurrent)}</td>
        <td style="text-align:right">${totalPrev > 0 ? formatCurrency(totalPrev) : '-'}</td>
        <td></td>
      </tr>
    </tbody>
  </table>
  <div class="footer">Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</div>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, '_blank')
    setTimeout(() => { win?.print(); URL.revokeObjectURL(url) }, 800)
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
        <Building2 className="w-5 h-5 text-emerald-500" />
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">Relatório por Empresa</h3>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Mês de referência</label>
            <input type="month" value={month} onChange={e => setMonth(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button onClick={handleGenerate} disabled={loading}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : <Building2 className="w-4 h-4" />}
            Gerar
          </button>
          {summaries.length > 0 && (
            <>
              <button onClick={exportExcel}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Excel
              </button>
              <button onClick={exportPDF}
                className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-medium px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2">
                <FileText className="w-4 h-4" /> PDF
              </button>
            </>
          )}
        </div>

        {searched && (
          summaries.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum dado encontrado para este mês</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Contas <span className="text-emerald-500 font-medium">pagas</span> em{' '}
                <span className="font-medium text-slate-600 dark:text-slate-300">{currentMonthLabel}</span>{' '}
                vs <span className="text-slate-500">{prevMonthLabel}</span>
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
                    {s.prevTotal > 0 && (
                      <p className="text-xs text-slate-400 text-right">Mês anterior: {formatCurrency(s.prevTotal)}</p>
                    )}
                  </div>
                )
              })}

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
