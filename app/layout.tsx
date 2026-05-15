import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PagFlow — Controle Financeiro Inteligente',
  description: 'Gerencie seus pagamentos, empresas e fluxo de caixa com eficiência.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased bg-white dark:bg-slate-950">
        {children}
      </body>
    </html>
  )
}
