import Link from 'next/link'
import {
  Wallet, BarChart3, Building2, FileSpreadsheet,
  CheckCircle, Shield, Zap, ArrowRight, Star, TrendingUp
} from 'lucide-react'

const features = [
  { icon: Wallet, title: 'Controle Total de Pagamentos', desc: 'Cadastre, acompanhe e corrija pagamentos em tempo real. Nunca mais perca uma data de vencimento.' },
  { icon: Building2, title: 'Múltiplas Empresas Pagantes', desc: 'Gerencie pagamentos de várias empresas em um único painel centralizado e organizado.' },
  { icon: BarChart3, title: 'Dashboard Inteligente', desc: 'Visualize pagamentos em aberto, pagos e atrasados com métricas em tempo real.' },
  { icon: FileSpreadsheet, title: 'Exportação para Excel', desc: 'Gere relatórios filtrados e exporte para Excel: Data, Referência, Valor e Empresa.' },
  { icon: Shield, title: 'Seguro e Multi-usuário', desc: 'Cada usuário tem seu próprio espaço seguro. Autenticação robusta com Supabase.' },
  { icon: Zap, title: 'Filtros em Todas as Abas', desc: 'Filtre por empresa, categoria, período e status em cada aba.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">PagFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Entrar</Link>
            <Link href="/register" className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-all">Começar grátis</Link>
          </div>
        </div>
      </nav>

      <section className="relative pt-36 pb-24 px-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <Star className="w-3 h-3" /> Controle financeiro para empresas
          </div>
          <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-6">
            Controle seus{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">pagamentos</span>
            {' '}sem complicação
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Gerencie contas a pagar, múltiplas empresas, gere relatórios em Excel e nunca mais atrase um pagamento.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="group bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2">
              Criar conta grátis <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/login" className="border border-white/10 hover:border-white/20 text-white font-medium px-8 py-4 rounded-xl text-base transition-all hover:bg-white/5">
              Já tenho conta
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-4">Sem cartão de crédito. 100% gratuito para começar.</p>
        </div>

        <div className="max-w-4xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: '3 Abas', label: 'A Pagar, Pagas e Atrasadas' },
            { value: '100%', label: 'Gratuito para começar' },
            { value: 'Excel', label: 'Relatórios exportáveis' },
            { value: 'N+', label: 'Empresas pagantes' },
          ].map(s => (
            <div key={s.value} className="bg-white/5 border border-white/8 rounded-xl p-5 text-center">
              <div className="text-2xl font-bold text-emerald-400 mb-1">{s.value}</div>
              <div className="text-xs text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Tudo para controlar seu financeiro</h2>
            <p className="text-slate-400 text-lg">Funcionalidades pensadas para gestores e contadores</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(f => (
              <div key={f.title} className="group bg-white/3 hover:bg-white/6 border border-white/8 hover:border-emerald-500/20 rounded-2xl p-6 transition-all">
                <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Pronto para organizar seu financeiro?</h2>
          <p className="text-slate-400 text-lg mb-10">Crie sua conta grátis e comece agora mesmo.</p>
          <Link href="/register" className="group inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all">
            Criar conta grátis <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center">
              <Wallet className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-sm">PagFlow</span>
          </div>
          <p className="text-slate-500 text-sm">© {new Date().getFullYear()} PagFlow. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
