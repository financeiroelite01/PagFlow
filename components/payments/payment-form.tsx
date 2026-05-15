'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Company, Payment } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { maskCurrency, parseCurrency, formatDateTime } from '@/lib/utils'
import { Paperclip, FileText, Receipt, ExternalLink, X, Landmark } from 'lucide-react'

const CATEGORIES = [
  'Aluguel', 'Energia', 'Água', 'Internet', 'Telefone',
  'Fornecedor', 'Salário', 'Impostos', 'Serviços', 'Outros',
]

interface PaymentFormProps {
  payment?: Payment | null
  companies: Company[]
  onSuccess: () => void
  onCancel: () => void
}

async function uploadFile(
  supabase: ReturnType<typeof createClient>,
  file: File,
  userId: string,
  paymentId: string,
  type: 'nf' | 'boleto' | 'receipt'
): Promise<string | null> {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${paymentId}/${type}.${ext}`
  const { error } = await supabase.storage
    .from('payment-files')
    .upload(path, file, { upsert: true })
  if (error) return null
  const { data } = supabase.storage.from('payment-files').getPublicUrl(path)
  return data.publicUrl
}

export function PaymentForm({ payment, companies, onSuccess, onCancel }: PaymentFormProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nfFile, setNfFile] = useState<File | null>(null)
  const [boletoFile, setBoletoFile] = useState<File | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [form, setForm] = useState({
    company_id: payment?.company_id || '',
    description: payment?.description || '',
    reference: payment?.reference || '',
    recipient: payment?.recipient || '',
    pix_key: payment?.pix_key || '',
    barcode: payment?.barcode || '',
    cost_center: payment?.cost_center || '',
    value: payment ? payment.value.toFixed(2).replace('.', ',') : '',
    due_date: payment?.due_date || '',
    payment_date: payment?.payment_date || '',
    paid_at: payment?.paid_at || '',
    category: payment?.category || '',
    notes: payment?.notes || '',
  })

  const isEditing = !!payment

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, value: maskCurrency(e.target.value) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.company_id) return setError('Selecione uma empresa pagante.')
    if (!form.description) return setError('Descrição é obrigatória.')
    if (!form.reference) return setError('Referência é obrigatória.')
    if (!form.value) return setError('Valor é obrigatório.')
    if (!form.due_date) return setError('Data de vencimento é obrigatória.')

    const value = parseCurrency(form.value)
    if (isNaN(value) || value <= 0) return setError('Valor inválido.')

    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    const userId = user!.id

    const payload: Record<string, unknown> = {
      company_id: form.company_id,
      description: form.description,
      reference: form.reference,
      recipient: form.recipient || null,
      pix_key: form.pix_key || null,
      barcode: form.barcode || null,
      cost_center: form.cost_center || null,
      value,
      due_date: form.due_date,
      payment_date: form.payment_date || null,
      paid_at: form.paid_at || null,
      category: form.category || null,
      notes: form.notes || null,
    }

    let paymentId = payment?.id

    // Insert or update
    if (isEditing) {
      const { error: updateErr } = await supabase
        .from('payments')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', payment.id)
      if (updateErr) { setError(updateErr.message); setLoading(false); return }
    } else {
      const { data: inserted, error: insertErr } = await supabase
        .from('payments')
        .insert([{ ...payload, user_id: userId }])
        .select('id')
        .single()
      if (insertErr) { setError(insertErr.message); setLoading(false); return }
      paymentId = inserted.id
    }

    // Upload files if selected
    const fileUpdates: Record<string, string | null> = {}
    if (nfFile && paymentId) {
      const url = await uploadFile(supabase, nfFile, userId, paymentId, 'nf')
      if (url) fileUpdates.nf_url = url
    }
    if (boletoFile && paymentId) {
      const url = await uploadFile(supabase, boletoFile, userId, paymentId, 'boleto')
      if (url) fileUpdates.boleto_url = url
    }
    if (receiptFile && paymentId) {
      const url = await uploadFile(supabase, receiptFile, userId, paymentId, 'receipt')
      if (url) fileUpdates.receipt_url = url
    }
    if (Object.keys(fileUpdates).length > 0 && paymentId) {
      await supabase.from('payments').update(fileUpdates).eq('id', paymentId)
    }

    setLoading(false)
    onSuccess()
  }

  const companyOptions = companies.map(c => ({ value: c.id, label: c.name }))

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Data de cadastro — travada */}
      <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400 flex gap-4">
        {isEditing ? (
          <>
            <p><span className="font-medium">Cadastrado em:</span> {formatDateTime(payment.created_at)}</p>
            <p className="text-slate-400 italic">(não editável)</p>
          </>
        ) : (
          <p><span className="font-medium">Data de cadastro:</span> será registrada automaticamente ao salvar</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Select
            label="Empresa Pagante *"
            options={companyOptions}
            placeholder="Selecione a empresa"
            value={form.company_id}
            onChange={e => handleChange('company_id', e.target.value)}
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Descrição *"
            placeholder="Ex: Conta de energia elétrica"
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
          />
        </div>

        <Input
          label="Referência *"
          placeholder="Ex: NF-001, Contrato-2024"
          value={form.reference}
          onChange={e => handleChange('reference', e.target.value)}
        />

        <Input
          label="Beneficiário (quem vai receber)"
          placeholder="Ex: Fornecedor ABC, João Silva"
          value={form.recipient}
          onChange={e => handleChange('recipient', e.target.value)}
        />

        <Input
          label="Valor (R$) *"
          placeholder="0,00"
          value={form.value}
          onChange={handleValueChange}
          inputMode="numeric"
        />

        <Input
          label="Chave PIX"
          placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
          value={form.pix_key}
          onChange={e => handleChange('pix_key', e.target.value)}
        />

        <div className="sm:col-span-2">
          <Input
            label="Código de Barras do Boleto"
            placeholder="000.00000 00000.000000 00000.000000 0 00000000000000"
            value={form.barcode}
            onChange={e => handleChange('barcode', e.target.value)}
          />
        </div>

        <Input
          label="Centro de Custo"
          placeholder="Ex: TI, Administrativo, Comercial"
          value={form.cost_center}
          onChange={e => handleChange('cost_center', e.target.value)}
        />

        <Input
          label="Data de Vencimento *"
          type="date"
          value={form.due_date}
          onChange={e => handleChange('due_date', e.target.value)}
        />

        <Input
          label="Data de Pagamento"
          type="date"
          value={form.payment_date}
          onChange={e => {
            handleChange('payment_date', e.target.value)
            handleChange('paid_at', e.target.value ? new Date().toISOString() : '')
          }}
          hint="Preencha apenas quando pago"
        />

        <Select
          label="Categoria"
          options={CATEGORIES.map(c => ({ value: c, label: c }))}
          placeholder="Selecione a categoria"
          value={form.category}
          onChange={e => handleChange('category', e.target.value)}
        />
      </div>

      {/* File uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* NF */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" /> Nota Fiscal (NF)
          </label>
          {payment?.nf_url && !nfFile && (
            <a href={payment.nf_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline mb-1">
              <ExternalLink className="w-3 h-3" /> Ver NF anexada
            </a>
          )}
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 transition-colors">
            <Paperclip className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{nfFile ? nfFile.name : 'Anexar NF'}</span>
            {nfFile && (
              <button type="button" onClick={e => { e.preventDefault(); setNfFile(null) }} className="ml-auto text-slate-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xml"
              onChange={e => setNfFile(e.target.files?.[0] || null)} />
          </label>
          <p className="text-xs text-slate-400">PDF, PNG, JPG, XML</p>
        </div>

        {/* Boleto */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 text-slate-400" /> Boleto
          </label>
          {payment?.boleto_url && !boletoFile && (
            <a href={payment.boleto_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline mb-1">
              <ExternalLink className="w-3 h-3" /> Ver boleto anexado
            </a>
          )}
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 transition-colors">
            <Paperclip className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{boletoFile ? boletoFile.name : 'Anexar Boleto'}</span>
            {boletoFile && (
              <button type="button" onClick={e => { e.preventDefault(); setBoletoFile(null) }} className="ml-auto text-slate-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg"
              onChange={e => setBoletoFile(e.target.files?.[0] || null)} />
          </label>
          <p className="text-xs text-slate-400">PDF, PNG, JPG</p>
        </div>

        {/* Comprovante */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-slate-400" /> Comprovante de Pagamento
          </label>
          {payment?.receipt_url && !receiptFile && (
            <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline mb-1">
              <ExternalLink className="w-3 h-3" /> Ver comprovante anexado
            </a>
          )}
          <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-400 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 text-sm text-slate-500 dark:text-slate-400 transition-colors">
            <Paperclip className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{receiptFile ? receiptFile.name : 'Anexar Comprovante'}</span>
            {receiptFile && (
              <button type="button" onClick={e => { e.preventDefault(); setReceiptFile(null) }} className="ml-auto text-slate-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg"
              onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
          </label>
          <p className="text-xs text-slate-400">PDF, PNG, JPG</p>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Observações</label>
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
          rows={3}
          placeholder="Notas adicionais..."
          value={form.notes}
          onChange={e => handleChange('notes', e.target.value)}
        />
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" loading={loading}>
          {isEditing ? 'Salvar Correção' : 'Cadastrar Pagamento'}
        </Button>
      </div>
    </form>
  )
}
