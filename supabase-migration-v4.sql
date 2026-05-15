-- =============================================
-- PAGFLOW — Migration v4
-- Execute no Supabase SQL Editor
-- =============================================

-- Adicionar novas colunas na tabela payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS pix_key    text,
  ADD COLUMN IF NOT EXISTS nf_url     text,
  ADD COLUMN IF NOT EXISTS receipt_url text;

-- =============================================
-- Criar bucket de storage para anexos
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-files', 'payment-files', true)
ON CONFLICT (id) DO NOTHING;

-- Política: usuário autenticado pode fazer upload dos próprios arquivos
CREATE POLICY "payment-files: upload own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Política: usuário pode ver os próprios arquivos
CREATE POLICY "payment-files: select own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Política: acesso público de leitura (para links funcionarem)
CREATE POLICY "payment-files: public read"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'payment-files');

-- Política: usuário pode atualizar os próprios arquivos
CREATE POLICY "payment-files: update own"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================
-- FIM DA MIGRATION v4
-- =============================================
