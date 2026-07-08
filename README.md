# Unimetra — Medicina e Segurança do Trabalho

Plataforma completa com **site institucional premium** + **painel interno** para clínicas de medicina ocupacional.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Prisma ORM + Neon PostgreSQL
- Auth.js (NextAuth v5) + bcryptjs
- React Hook Form + Zod
- Deploy: Vercel

## Funcionalidades

### Site público
- Home comercial com CTAs, FAQ, mapa e preparo de exames
- Serviços por categoria
- Exames com busca e filtro
- Encaminhamento online (formulário em 6 etapas → salva no banco)
- Blog/atualizações
- Política de privacidade e termos (LGPD)

### Painel `/dashboard`
- Login com perfis (clínica, comercial, financeiro, empresa/RH, etc.)
- Módulos operacionais: empresas, colaboradores, pré-encaminhamentos, encaminhamentos, agenda, documentos, exames
- Gestão: fechamento mensal, financeiro, orçamentos, tarefas, chamados, assistente SST
- Sistema: usuários (CRUD), configurações, conteúdo/blog, auditoria
- Super Admin: clínicas, chamados SaaS, configurações globais

## Instalação

```bash
# 1. Clonar e instalar
git clone https://github.com/mentorupbrasil/ssma.git
cd ssma
npm install

# 2. Configurar ambiente
cp .env.example .env
# Edite DATABASE_URL e AUTH_SECRET

# 3. Banco de dados
npm run db:push
npm run db:seed

# 4. Rodar
npm run dev
```

Acesse: http://localhost:3000

## Credenciais demo (seed)

| Perfil   | E-mail              | Senha          |
|----------|---------------------|----------------|
| Admin    | admin@demo.com      | Admin@123      |
| Recepção | recepcao@demo.com   | Recepcao@123   |
| Empresa  | empresa@demo.com    | Empresa@123    |

## Deploy na Vercel

### 1. Variáveis de ambiente (obrigatório antes do deploy)

No painel Vercel → **Settings → Environment Variables**, adicione:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | Connection string do Neon PostgreSQL |
| `AUTH_SECRET` | String aleatória segura (`openssl rand -base64 32`) |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_URL` / `NEXTAUTH_URL` | URL do site (ex: `https://ssma.vercel.app`) |
| `DIRECT_URL` | (Neon) URL direta para migrations |
| `RESEND_API_KEY` | (Opcional) Envio de e-mails |
| `BLOB_READ_WRITE_TOKEN` | (Opcional) Storage de documentos na Vercel |

Marque todas para **Production**, **Preview** e **Development**.

Dados da clínica (endereço, WhatsApp, horários, mapa) ficam em `src/config/clinic.ts` — não precisam de variáveis no Vercel.

### 2. Deploy

1. Conecte o repositório GitHub `mentorupbrasil/ssma`
2. Confirme que as variáveis acima estão salvas
3. Faça redeploy (Deployments → ⋮ → Redeploy)

### 3. Banco de dados (uma vez após o primeiro deploy)

```bash
npx vercel env pull .env.local
npm run db:push
npm run db:seed
```

Ou rode `db:push` e `db:seed` localmente usando a mesma `DATABASE_URL` do Neon.

## Estrutura

```
src/
├── app/(public)/     # Site institucional
├── app/(auth)/       # Login
├── app/(dashboard)/  # Painel privado
├── actions/          # Server Actions
├── components/       # UI reutilizável
├── data/             # Conteúdo estático
├── lib/              # Auth, Prisma, permissões
├── schemas/          # Validações Zod
└── types/            # Tipos e labels
prisma/
├── schema.prisma
└── seed.ts
```

## Segurança e LGPD

- Senhas com bcryptjs (12 rounds)
- Middleware protegendo `/dashboard`
- Controle de acesso por perfil
- Logs de auditoria
- Consentimento em formulários públicos
- Dados fictícios no seed
- MVP sem prontuário médico completo

## Renomear a clínica

Edite o objeto `CLINIC_SITE` em `src/config/clinic.ts`.

## Licença

Projeto privado — MentorUp Brasil / Unimetra.
