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
- Login com perfis: ADMIN, RECEPCAO, MEDICO, TECNICO, FINANCEIRO, EMPRESA, VISUALIZADOR
- Dashboard com indicadores reais
- CRUD: empresas, pacientes, encaminhamentos
- Agenda, exames, orçamentos/leads, documentos, usuários, configurações, auditoria

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
| `NEXTAUTH_URL` | URL do site (ex: `https://ssma.vercel.app`) |
| `NEXT_PUBLIC_CLINIC_NAME` | Nome da clínica |
| `NEXT_PUBLIC_CLINIC_PHONE` | Telefone |
| `NEXT_PUBLIC_CLINIC_WHATSAPP` | WhatsApp (só números, ex: `5511999999999`) |
| `NEXT_PUBLIC_CLINIC_EMAIL` | E-mail |
| `NEXT_PUBLIC_CLINIC_ADDRESS` | Endereço |

Marque todas para **Production**, **Preview** e **Development**.

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

Altere as variáveis `NEXT_PUBLIC_CLINIC_*` no `.env` ou a tabela `Setting` no banco.

## Licença

Projeto privado — MentorUp Brasil / Unimetra.
