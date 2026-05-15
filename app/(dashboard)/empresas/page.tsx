import { CompaniesManager } from '@/components/companies/companies-manager'

export default function EmpresasPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Empresas Pagantes</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Cadastre e gerencie as empresas vinculadas aos pagamentos</p>
      </div>
      <CompaniesManager />
    </div>
  )
}
