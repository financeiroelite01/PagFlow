'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

interface UserProfileModalProps {
  open: boolean
  onClose: () => void
  currentName: string
  email: string
}

export function UserProfileModal({ open, onClose, currentName, email }: UserProfileModalProps) {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [name, setName] = useState(currentName)
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' })

  const handleSaveName = async () => {
    if (!name.trim()) return setError('Nome não pode ser vazio.')
    setLoading(true)
    setError('')
    setSuccess('')
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } })
    setLoading(false)
    if (error) setError(error.message)
    else setSuccess('Nome atualizado com sucesso!')
  }

  const handleChangePassword = async () => {
    if (!passwords.newPass) return setError('Nova senha é obrigatória.')
    if (passwords.newPass.length < 6) return setError('A senha deve ter pelo menos 6 caracteres.')
    if (passwords.newPass !== passwords.confirm) return setError('As senhas não coincidem.')
    setLoading(true)
    setError('')
    setSuccess('')
    const { error } = await supabase.auth.updateUser({ password: passwords.newPass })
    setLoading(false)
    if (error) setError(error.message)
    else {
      setSuccess('Senha alterada com sucesso!')
      setPasswords({ current: '', newPass: '', confirm: '' })
    }
  }

  const handleClose = () => {
    setError('')
    setSuccess('')
    setPasswords({ current: '', newPass: '', confirm: '' })
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Meu Perfil" size="md">
      <div className="space-y-6">
        {/* Email (read only) */}
        <Input
          label="E-mail"
          value={email}
          readOnly
          hint="O e-mail não pode ser alterado."
        />

        {/* Name section */}
        <div className="space-y-3">
          <Input
            label="Nome completo"
            placeholder="Seu nome"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <Button onClick={handleSaveName} loading={loading} size="sm">
            Salvar nome
          </Button>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700" />

        {/* Password section */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Alterar Senha</p>
          <Input
            label="Nova senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={passwords.newPass}
            onChange={e => setPasswords(p => ({ ...p, newPass: e.target.value }))}
          />
          <Input
            label="Confirmar nova senha"
            type="password"
            placeholder="Repita a nova senha"
            value={passwords.confirm}
            onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
          />
          <Button onClick={handleChangePassword} loading={loading} size="sm" variant="secondary">
            Alterar senha
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}
      </div>
    </Modal>
  )
}
