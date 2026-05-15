# 🚀 PagFlow — Controle de Pagamentos SaaS

Sistema completo de controle financeiro multi-usuário.

## ✅ Funcionalidades

- Multi-usuário com dados isolados por usuário
- Múltiplas empresas pagantes
- Cadastro e correção de pagamentos
- 3 abas: A Pagar, Atrasados, Pagos (com filtros em cada aba)
- Filtros: empresa, categoria, data, status, busca textual
- Exportação para Excel com colunas: Data Pgto, Referência, Valor, Empresa
- Data de cadastro fixa (não editável)
- Landing page moderna

## 📋 Deploy (Passo a Passo)

### ETAPA 1 — Supabase

1. Acesse supabase.com → New Project → nome: pagflow → Region: South America
2. Vá em SQL Editor → New Query
3. Cole o conteúdo de `supabase-schema.sql` → Run
4. Vá em Settings → API → copie: Project URL e anon/public key

### ETAPA 2 — GitHub

```bash
git init && git add . && git commit -m "feat: PagFlow"
# Crie repo no github.com e faça push
git remote add origin https://github.com/SEU_USUARIO/pagflow.git
git push -u origin main
```

### ETAPA 3 — Vercel

1. vercel.com → Add New Project → selecione o repo pagflow
2. Environment Variables:
   - NEXT_PUBLIC_SUPABASE_URL = [seu project url]
   - NEXT_PUBLIC_SUPABASE_ANON_KEY = [seu anon key]
3. Deploy → aguarde ~2 minutos

### ETAPA 4 — Configurar Callback

No Supabase → Authentication → URL Configuration:
- Site URL: https://pagflow.vercel.app
- Redirect URLs: https://pagflow.vercel.app/callback

## 🖥 Local

```bash
npm install
cp .env.local.example .env.local  # edite com suas chaves
npm run dev
```

## 🔐 Segurança

Row Level Security (RLS) ativo. Cada usuário só acessa seus próprios dados.
