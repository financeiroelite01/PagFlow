-- =============================================
-- PAGFLOW — Migration Rodada 1
-- Execute no Supabase SQL Editor
-- =============================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS barcode    text,
  ADD COLUMN IF NOT EXISTS cost_center text;

-- =============================================
-- FIM DA MIGRATION RODADA 1
-- =============================================
