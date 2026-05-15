import { createClient } from '@/lib/supabase/server'
import { getPaymentStatus, formatCurrency } from '@/lib/utils'
import { CreditCard, TrendingUp, AlertCircle, CheckCircle2, Building2, Clock } from 'lucide-react'
import Link from 'next/link'
import { DashboardCharts } from '@/components/payments/dashboard-charts'
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: payments } = await supabase
    .from('payments')
    .select('*, company:companies(name)')
    .order('due_date', { ascending: true })

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')

  const allPayments = (payments || []).map(p => ({
    ...p,
    status: getPaymentStatus(p.due_date, p.paid_at),
  }))

  const pending = allPayments.filter(p => p.status === 'pending')
  const paid = allPayments.filter(p => p.status === 'paid')
  const overdue = allPayments.filter(p => p.status === 'overdue')

  const pendingTotal = pending.reduce((s, p) => s + p.value, 0)
  const paidTotal = paid.reduce((s, p) => s + p.value, 0)
  const overdueTotal = overdue.reduce((s, p) => s + p.value, 0)

  const nextDue = pending.slice(0, 5)
  const name = user?.user_metadata?.full_name?.split(' ')[0] || 'Usuário'

  // Monthly data for charts — last 6 months
  const monthlyData = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i)
    const monthStart = startOfMonth(date).toISOString().split('T')[0]
    const monthEnd = endOfMonth(date).toISOString().split('T')[0]
    const label = format(date, 'MMM', { locale: ptBR })

    const monthPayments = allPayments.filter(p => p.due_date >= monthStart && p.due_date <= monthEnd)
    return {
      month: label.charAt(0).toUpperCase() + label.slice(1),
      paid: monthPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.value, 0),
      pending: monthPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.value, 0),
      overdue: monthPayments.filter(p => p.status === 'overdue').reduce((s, p) => s + p.value, 0),
    }
  })

  // Category data for pie chart
  const categoryMap: Record<string, number> = {}
  allPayments.forEach(p => {
    const cat = p.category || 'Outros'
    categoryMap[cat] = (categoryMap[cat] || 0) + p.value
  })
  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Olá, {name}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Aqui está o resumo dos seus pagamentos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'A Pagar', value: formatCurrency(pendingTotal), count: pending.length, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-100 dark:border-amber-900/30' },
          { title: 'Pagos', value: formatCurrency(paidTotal), count: paid.length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-100 dark:border-emerald-900/30' },
          { title: 'Atrasados', value: formatCurrency(overdueTotal), count: overdue.length, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-100 dark:border-red-900/30' },
          { title: 'Empresas', value: String(companies?.length || 0), count: null, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-100 dark:border-blue-900/30' },
        ].map(stat => (
          <div key={stat.title} className={`bg-white dark:bg-slate-800 rounded-xl border ${stat.border} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
              <div className={`w-9 h-9 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            {stat.count !== null && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{stat.count} {stat.count === 1 ? 'registro' : 'registros'}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <DashboardCharts monthlyData={monthlyData} categoryData={categoryData} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Next due */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Próximos Vencimentos</h2>
            <Link href="/pagamentos" className="text-xs text-emerald-500 hover:text-emerald-400 font-medium">Ver todos →</Link>
          </div>
          {nextDue.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">Nenhum pagamento pendente</div>
          ) : (
            <div className="space-y-3">
              {nextDue.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/30">
                  <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.description}</p>
                    <p className="text-xs text-slate-500">{p.company?.name} · {p.due_date}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">{formatCurrency(p.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200">Pagamentos Atrasados</h2>
            {overdue.length > 0 && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium px-2 py-0.5 rounded-full">
                {overdue.length} atrasado{overdue.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {overdue.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum pagamento atrasado!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdue.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{p.description}</p>
                    <p className="text-xs text-red-500">Venceu em {p.due_date} · {p.company?.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-500 whitespace-nowrap">{formatCurrency(p.value)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/pagamentos', label: 'Novo Pagamento', icon: CreditCard, desc: 'Cadastrar conta a pagar' },
          { href: '/empresas', label: 'Empresas', icon: Building2, desc: 'Gerenciar empresas pagantes' },
          { href: '/relatorios', label: 'Relatórios', icon: TrendingUp, desc: 'Gerar e exportar Excel' },
          { href: '/pagamentos', label: 'Ver Todos', icon: CheckCircle2, desc: 'Ver todos os pagamentos' },
        ].map(item => (
          <Link key={item.href + item.label} href={item.href}
            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-emerald-500/30 hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-all">
            <item.icon className="w-5 h-5 text-emerald-500 mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
