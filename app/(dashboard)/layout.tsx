import { Sidebar } from '@/components/layout/sidebar'
import { DueSoonPopup } from '@/components/payments/due-soon-popup'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <DueSoonPopup />
      <div className="lg:pl-64 pt-14 lg:pt-0">
        <main className="min-h-screen p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
