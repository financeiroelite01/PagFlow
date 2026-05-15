import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, isAfter, isBefore, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date: string | null): string {
  if (!date) return '-'
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return '-'
  }
}

export function formatDateTime(date: string | null): string {
  if (!date) return '-'
  try {
    return format(parseISO(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
  } catch {
    return '-'
  }
}

export function getPaymentStatus(dueDate: string, paidAt: string | null): 'paid' | 'overdue' | 'pending' {
  if (paidAt) return 'paid'
  const today = startOfDay(new Date())
  const due = startOfDay(parseISO(dueDate))
  if (isBefore(due, today)) return 'overdue'
  return 'pending'
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.')
  return parseFloat(cleaned) || 0
}

export function maskCurrency(value: string): string {
  const numbers = value.replace(/\D/g, '')
  if (!numbers) return ''
  const amount = parseInt(numbers) / 100
  return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
