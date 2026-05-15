import { createClient } from '@/lib/supabase/server'
import { ReportsExport } from '@/components/payments/reports-export'

export default async function RelatoriosPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase.from('companies').select('*').order('name')

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Filtre e exporte relatórios de pagamentos para Excel
        </p>
      </div>

      <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 rounded-xl px-5 py-4">
        <p className="text-sm text-emerald-700 dark:text-emerald-400">
          <span className="font-semibold">Colunas no Excel:</span>{' '}
          Data do Pagamento · Referência · Valor · Empresa Pagante · Status · Descrição · Categoria · Observações
        </p>
      </div>

      <ReportsExport companies={companies || []} />
    </div>
  )
}
