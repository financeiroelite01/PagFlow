'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Company } from '@/lib/types'
import { PaymentsTable } from '@/components/payments/payments-table'
import { Clock, CheckCircle2, AlertCircle, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

type TabKey = 'all' | 'pending' | 'paid' | 'overdue'

const TABS: { key: TabKey; label: string; icon: typeof Clock }[] = [
  { key: 'all', label: 'Todos', icon: CreditCard },
  { key: 'pending', label: 'A Pagar', icon: Clock },
  { key: 'overdue', label: 'Atrasados', icon: AlertCircle },
  { key: 'paid', label: 'Pagos', icon: CheckCircle2 },
]

export default function PagamentosPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    supabase.from('companies').select('*').order('name').then(({ data }) => {
      setCompanies(data || [])
    })
  }, [])

  const tabColors: Record<TabKey, string> = {
    all: 'text-slate-600 dark:text-slate-300 border-slate-500',
    pending: 'text-amber-500 border-amber-500',
    overdue: 'text-red-500 border-red-500',
    paid: 'text-emerald-500 border-emerald-500',
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Pagamentos</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Gerencie todas as suas contas a pagar</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all duration-150',
                activeTab === tab.key
                  ? tabColors[tab.key]
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <PaymentsTable tab={activeTab} companies={companies} />
    </div>
  )
}
