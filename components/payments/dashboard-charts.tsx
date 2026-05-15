'use client'

import { formatCurrency } from '@/lib/utils'

interface MonthlyData {
  month: string
  paid: number
  pending: number
  overdue: number
}

interface CategoryData {
  name: string
  value: number
}

interface DashboardChartsProps {
  monthlyData: MonthlyData[]
  categoryData: CategoryData[]
}

const COLORS = ['#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316']

function BarChartSVG({ data }: { data: MonthlyData[] }) {
  const maxVal = Math.max(...data.flatMap(d => [d.paid, d.pending, d.overdue]), 1)
  const h = 160
  const w = 100 / data.length

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${data.length * 60} ${h + 30}`} className="w-full">
        {data.map((d, i) => {
          const x = i * 60 + 4
          const bars = [
            { val: d.paid, color: '#10b981' },
            { val: d.pending, color: '#f59e0b' },
            { val: d.overdue, color: '#ef4444' },
          ]
          return (
            <g key={i}>
              {bars.map((b, j) => {
                const bh = Math.max((b.val / maxVal) * h, 1)
                return (
                  <rect
                    key={j}
                    x={x + j * 17}
                    y={h - bh}
                    width={14}
                    height={bh}
                    rx={3}
                    fill={b.color}
                    opacity={0.85}
                  />
                )
              })}
              <text x={x + 25} y={h + 18} textAnchor="middle" fontSize={10} fill="#94a3b8">{d.month}</text>
            </g>
          )
        })}
      </svg>
      <div className="flex gap-4 justify-center mt-1">
        {[{ color: '#10b981', label: 'Pagos' }, { color: '#f59e0b', label: 'A Pagar' }, { color: '#ef4444', label: 'Atrasados' }].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
            <span className="text-xs text-slate-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PieChartSVG({ data }: { data: CategoryData[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const cx = 80, cy = 80, r = 60, ir = 35
  let angle = -Math.PI / 2
  const slices = data.slice(0, 8).map((d, i) => {
    const slice = (d.value / total) * 2 * Math.PI
    const x1 = cx + r * Math.cos(angle)
    const y1 = cy + r * Math.sin(angle)
    angle += slice
    const x2 = cx + r * Math.cos(angle)
    const y2 = cy + r * Math.sin(angle)
    const ix1 = cx + ir * Math.cos(angle - slice)
    const iy1 = cy + ir * Math.sin(angle - slice)
    const ix2 = cx + ir * Math.cos(angle)
    const iy2 = cy + ir * Math.sin(angle)
    const large = slice > Math.PI ? 1 : 0
    return {
      path: `M ${ix1} ${iy1} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${ir} ${ir} 0 ${large} 0 ${ix1} ${iy1} Z`,
      color: COLORS[i % COLORS.length],
      label: d.name,
      value: d.value,
    }
  })

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 160 160" className="w-36 h-36 flex-shrink-0">
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.9} />)}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {slices.slice(0, 6).map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-slate-400 truncate flex-1">{s.label}</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 flex-shrink-0">
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardCharts({ monthlyData, categoryData }: DashboardChartsProps) {
  const hasData = monthlyData.some(d => d.paid + d.pending + d.overdue > 0)
  if (!hasData && categoryData.length === 0) return null

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Evolução Mensal</h2>
        <BarChartSVG data={monthlyData} />
      </div>

      {categoryData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Gastos por Categoria</h2>
          <PieChartSVG data={categoryData} />
          <p className="text-xs text-slate-400 mt-3 text-right">Total: {formatCurrency(categoryData.reduce((s,d) => s+d.value, 0))}</p>
        </div>
      )}
    </div>
  )
}
