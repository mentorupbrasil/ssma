export type BlogPostSeed = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  coverImage: string;
  coverImageAlt: string;
  publishedAt: string;
};

/** Conteúdo editorial SST — fontes: NR-01, NR-07, Manual eSocial, boas práticas de mercado. */
export const BLOG_POSTS: BlogPostSeed[] = [
  {
    title: "Integração PGR, PCMSO e eSocial: o que muda na rotina do RH em 2026",
    slug: "integracao-pgr-pcmso-esocial-2026",
    excerpt:
      "Entenda como alinhar riscos do PGR, exames do PCMSO e eventos S-2220/S-2240 para reduzir inconsistências e passivos trabalhistas.",
    category: "Normas e legislação",
    coverImage:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Profissional analisando documentos de gestão empresarial",
    publishedAt: "2026-03-12T10:00:00.000Z",
    content: `A integração entre PGR, PCMSO e eSocial deixou de ser recomendação e passou a ser requisito de maturidade em SST. Quando esses pilares não conversam, a empresa acumula inconsistências que só aparecem em fiscalização, auditoria ou ação trabalhista.

## Por que a integração importa

O PGR (NR-01) define os riscos reais de cada função. O PCMSO (NR-07) determina quais exames e monitoramentos são necessários com base nesses riscos. O eSocial registra essa cadeia nos eventos S-2240 (condições ambientais) e S-2220 (monitoramento da saúde do trabalhador).

Se o colaborador está exposto a ruído no PGR, mas o exame audiométrico não aparece no PCMSO nem no S-2220, há incoerência técnica. Esse é um dos erros mais comuns em fiscalizações.

## Passo a passo prático para o RH

### 1. Comece pelo inventário de riscos
Revise o PGR por setor e função. Confirme se mudanças de processo, máquinas ou layout foram refletidas no documento nos últimos 12 meses.

### 2. Cruze PCMSO com o PGR
Cada risco relevante deve ter resposta clínica no PCMSO: exame complementar, periodicidade e critério de aptidão. Desalinhamento aqui gera ASO incompleto.

### 3. Valide eventos do eSocial
Antes de fechar a folha do mês, confira se S-2240 e S-2220 estão coerentes com laudos, LTCAT e ASOs emitidos. Divergência entre exposição declarada e exame realizado é alerta vermelho.

### 4. Documente mudanças de função
Toda alteração de cargo, setor ou exposição deve disparar revisão de risco, exame (quando aplicável) e atualização dos eventos.

## Erros que geram multa e retrabalho

- Enviar S-2220 sem coerência com o S-2240
- Manter ASO sem referência aos riscos do PGR
- Perder prazo de exame periódico definido no PCMSO
- Usar planilhas paralelas sem controle de versão documental

## Checklist mensal para o RH

- Exames periódicos vencendo nos próximos 30/60 dias
- Admissões com ASO admissional arquivado e evento enviado
- Desligamentos com avaliação demissional quando exigida
- Atualização de PGR/PCMSO após mudanças operacionais

## Conclusão

Integrar PGR, PCMSO e eSocial não é burocracia extra: é governança. Empresas que tratam SST como fluxo contínuo — e não como evento isolado na admissão — reduzem custo operacional, evitam autuações e ganham previsibilidade na rotina do RH.`,
  },
  {
    title: "5 erros comuns na gestão de ASO (e como corrigir antes da fiscalização)",
    slug: "erros-gestao-aso",
    excerpt:
      "ASO mal arquivado, sem vínculo com o PGR ou fora do prazo no eSocial pode virar passivo trabalhista. Veja os erros mais frequentes e como organizar o fluxo.",
    category: "Saúde ocupacional",
    coverImage:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Médico com estetoscópio em atendimento clínico",
    publishedAt: "2026-01-18T14:30:00.000Z",
    content: `O Atestado de Saúde Ocupacional é o documento que sintetiza a aptidão do colaborador para a função. Na prática, muitas empresas ainda tratam o ASO como formalidade — e pagam caro por isso em auditorias, eSocial e processos trabalhistas.

## Erro 1: ASO sem relação com o PGR

Pela NR-07, o ASO deve indicar os riscos ocupacionais identificados no PGR que demandam controle médico — ou registrar a inexistência deles. ASO genérico, sem essa referência, fragiliza a defesa da empresa.

**Como corrigir:** padronize modelo de ASO com campo obrigatório de riscos/avaliações e valide com o médico coordenador do PCMSO.

## Erro 2: Armazenamento desorganizado

Pastas físicas sem controle de validade, ASO em e-mail pessoal do gestor ou arquivos com nome inconsistente dificultam rastreio e prova documental.

**Como corrigir:** centralize ASOs por colaborador com data, tipo de exame e status de envio ao eSocial (S-2220).

## Erro 3: Perder prazo de periódico

O PCMSO define periodicidade por risco e função. Perder o prazo significa colaborador em atividade sem monitoramento em dia — exposição direta em fiscalização.

**Como corrigir:** use calendário de vencimentos com alertas 60/30/15 dias e integre com fluxo de encaminhamento.

## Erro 4: Falha no envio do S-2220

O evento deve refletir o exame realizado, com CPF, matrícula, tipo de exame e resultado. Erro de digitação ou envio tardio gera inconsistência na base nacional.

**Como corrigir:** valide dados cadastrais antes do exame e estabeleça SLA de envio com a clínica ou SESMT.

## Erro 5: Tratar ASO demissional como opcional

Quando aplicável, o exame demissional é obrigatório e tem finalidade de registro de saúde ocupacional no desligamento. Confundir com “opcional” é risco jurídico.

**Como corrigir:** inclua regra clara no fluxo de desligamento: função, risco, data de último exame e necessidade de demissional.

## Boas práticas que funcionam

- Fluxo único: admissão → periódicos → mudança de função → retorno → desligamento
- Responsável definido no RH para conferir documentação mensalmente
- Clínica ocupacional com entrega padronizada e prazo acordado
- Revisão semestral do processo com SESMT ou consultoria SST

Organizar a gestão de ASO é investimento em conformidade e em proteção do colaborador. Empresas com processo claro gastam menos tempo apagando incêndio e mais tempo operando com segurança.`,
  },
  {
    title: "Exames admissionais: guia prático para RH organizar o primeiro dia",
    slug: "exames-admissionais-guia-rh",
    excerpt:
      "Do encaminhamento ao ASO arquivado: o que solicitar na admissão, quais exames são mais comuns e como evitar atraso na integração do colaborador.",
    category: "Exames ocupacionais",
    coverImage:
      "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Equipe de RH em reunião de planejamento",
    publishedAt: "2025-09-24T09:15:00.000Z",
    content: `O exame admissional é a primeira etapa de conformidade na vida do colaborador na empresa. Bem conduzido, evita contratação de pessoa inapta para a função e acelera a integração. Mal conduzido, gera retrabalho, atraso de início e risco legal.

## O que é e quando realizar

O exame admissional deve ser feito antes do início das atividades, conforme NR-07. Ele avalia se o trabalhador está apto para a função e estabelece linha de base para exames futuros.

## O que considerar antes de encaminhar

- Cargo e setor (exposição prevista)
- Riscos do PGR para a função
- Exames complementares previstos no PCMSO
- Documentação: ASO, laudos e evento S-2220 após conclusão

## Exames complementares mais solicitados

Dependendo da atividade, podem ser necessários audiometria, acuidade visual, espirometria, eletrocardiograma, exames laboratoriais, toxicológico (quando aplicável) e outros definidos tecnicamente no PCMSO.

## Fluxo recomendado para o RH

### 1. Pré-admissão
Confirme dados cadastrais, função e documentos. Envie encaminhamento com informações completas para a clínica.

### 2. Agendamento
Combine data e orientações de preparo (jejum, medicamentos, documentos pessoais).

### 3. Pós-exame
Receba ASO, arquive por colaborador e valide envio do S-2220. Só então confirme início efetivo em atividade de risco.

## Erros comuns na admissão

- Encaminhar sem descrição da função
- Iniciar trabalho antes do ASO
- Não registrar exames complementares exigidos
- Não atualizar prontuário ocupacional

## Dica para empresas com alto volume

Padronize kit de admissão: checklist de documentos, modelo de encaminhamento e SLA com clínica ocupacional. Isso reduz falhas e melhora experiência do candidato.

Um processo admissional organizado protege o colaborador, a empresa e a equipe de RH — especialmente em períodos de contratação intensa.`,
  },
  {
    title: "NR-1 e o PGR: o que toda empresa precisa revisar agora",
    slug: "nr1-novo-pgr",
    excerpt:
      "Com o PGR como eixo da gestão de riscos, entenda escopo, responsabilidades, revisão documental e impacto direto nos exames ocupacionais.",
    category: "Segurança do trabalho",
    coverImage:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Profissional com equipamento de segurança no ambiente de trabalho",
    publishedAt: "2025-11-08T11:45:00.000Z",
    content: `A revisão da NR-01 reforçou o Programa de Gerenciamento de Riscos (PGR) como documento central da SST. Para o RH, isso muda a lógica: não basta “ter PGR na prateleira” — é preciso que ele oriente exames, treinamentos, controles e eventos do eSocial.

## O que é o PGR na prática

O PGR reúne identificação de perigos, avaliação de riscos, medidas de controle e plano de ação. Substitui a lógica antiga de manter documentos desconectados sem gestão integrada.

## Quem precisa de PGR

Em regra, empregadores e órgãos públicos com empregados regidos pela CLT devem implementar o gerenciamento de riscos ocupacionais, respeitando grau de risco e porte.

## Relação direta com PCMSO e exames

Cada risco relevante deve refletir no PCMSO: monitoramento clínico, exame complementar e periodicidade. Sem PGR atualizado, o PCMSO perde base técnica.

## Quando revisar o PGR

- Mudança de layout, processo ou máquina
- Novo produto químico ou EPI
- Acidente ou doença relacionada ao trabalho
- Alteração significativa de efetivo ou função
- No mínimo, revisão anual recomendada

## Integração com eSocial (S-2240)

O S-2240 comunica exposições a agentes nocivos. Dados devem ser coerentes com o que está no PGR e com exames declarados no S-2220.

## Checklist rápido para gestores

- PGR assinado e datado com responsável técnico habilitado
- Inventário de riscos por função/setor
- Plano de ação com prazos e responsáveis
- Evidência de treinamentos e comunicação de riscos
- Vínculo com PCMSO e LTCAT/laudos quando aplicável

Tratar o PGR como documento vivo — e não como obrigação anual — é o que separa empresas reativas de empresas preparadas para fiscalização e crescimento.`,
  },
  {
    title: "PCMSO: obrigações, prazos e o que o RH precisa controlar",
    slug: "pcmso-obrigacoes-prazos",
    excerpt:
      "Guia objetivo sobre PCMSO (NR-07): quem precisa, o que deve conter, periodicidade de exames e como manter o programa atualizado.",
    category: "Medicina do trabalho",
    coverImage:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Ambiente hospitalar moderno e organizado",
    publishedAt: "2025-10-15T08:00:00.000Z",
    content: `O Programa de Controle Médico de Saúde Ocupacional (PCMSO) é a espinha dorsal da medicina do trabalho na empresa. Ele define como a saúde do colaborador será monitorada ao longo do vínculo empregatício.

## Quem é obrigado a ter PCMSO

Empresas que admitam trabalhadores como empregados devem elaborar e implementar PCMSO, conforme NR-07, com médico coordenador responsável.

## Estrutura mínima do programa

- Identificação da empresa e riscos relevantes
- Planejamento de exames clínicos e complementares
- Periodicidade por função/risco
- Critérios de encaminhamento e aptidão
- Relatório analítico anual

## Tipos de exame no PCMSO

- Admissional
- Periódico
- Retorno ao trabalho
- Mudança de função
- Demissional (quando aplicável)

## Prazos que o RH não pode perder

A periodicidade dos periódicos é definida no PCMSO com base no risco. Perder prazo significa monitoramento vencido — um dos principais achados em fiscalização.

Monte calendário por colaborador com data do último exame e próximo vencimento. Alertas automáticos evitam falhas em operações com centenas de funcionários.

## Relação com ASO e eSocial

Cada exame gera ASO. Os dados alimentam o evento S-2220. PCMSO desatualizado gera exames incompletos e eventos inconsistentes.

## Relatório analítico

Ao final de cada ano, o PCMSO deve consolidar indicadores e achados. Use esse relatório para ações preventivas com SESMT, lideranças e diretoria.

## Conclusão

PCMSO bem estruturado não é custo: é mecanismo de prevenção, produtividade e conformidade. O RH tem papel central em garantir que o que está no papel aconteça no dia a dia.`,
  },
  {
    title: "Exames periódicos: como o RH evita atrasos e multas",
    slug: "exames-periodicos-controle-rh",
    excerpt:
      "Calendário, alertas, encaminhamento e conferência de ASO: um fluxo simples para não perder periodicidade definida no PCMSO.",
    category: "Dicas",
    coverImage:
      "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Profissionais em reunião de planejamento corporativo",
    publishedAt: "2026-02-06T16:20:00.000Z",
    content: `Exame periódico vencido é um dos problemas mais frequentes — e mais evitáveis — na rotina de SST. Com volume alto de colaboradores, planilhas soltas não funcionam. É preciso fluxo.

## Por que o periódico é crítico

Ele monitora a saúde do trabalhador exposto a riscos ao longo do tempo. A NR-07 define que a periodicidade deve constar no PCMSO, variando conforme agente e função.

## Montando um calendário confiável

Registre para cada colaborador:
- Data do último exame
- Tipo (periódico, função, setor)
- Próximo vencimento
- Exames complementares vinculados

## Janela de antecedência recomendada

- 60 dias: planejamento com gestores
- 30 dias: encaminhamento e agendamento
- 15 dias: escalonamento para casos pendentes
- Vencido: bloqueio operacional em atividades de risco (conforme política interna)

## Integração com lideranças

Supervisores devem saber quando sua equipe precisa se ausentar para exame. Comunicação antecipada reduz impacto na operação e aumenta adesão.

## Conferência pós-exame

Não basta realizar: exija ASO, atualize prontuário e valide S-2220. RH deve tratar exame como processo fechado, não como “comparecimento”.

## Indicadores para diretoria

- % de periódicos em dia
- Tempo médio entre vencimento e realização
- Número de colaboradores com documentação incompleta

Periódico em dia é sinal de empresa madura em SST. O segredo não é complexidade — é consistência.`,
  },
  {
    title: "S-2220 e S-2240: como evitar inconsistências no eSocial SST",
    slug: "esocial-s2220-s2240-coerencia",
    excerpt:
      "Entenda a diferença entre os eventos, prazos de envio e o cruzamento de dados que o fiscal — e o sistema — esperam encontrar.",
    category: "Normas e legislação",
    coverImage:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Laboratório com equipamentos de análise clínica",
    publishedAt: "2026-04-22T13:00:00.000Z",
    content: `Os eventos S-2220 e S-2240 são o coração da SST digital no eSocial. Quando não estão alinhados, a empresa expõe inconsistências que podem gerar multa, retrabalho e fragilidade em processos trabalhistas.

## S-2240: condições ambientais

Registra exposição a agentes nocivos conforme avaliação do PGR e documentação técnica. Informa fatores físicos, químicos, biológicos e outros relevantes.

## S-2220: monitoramento da saúde

Registra exames e ASO: admissional, periódico, retorno, mudança de função e demissional, com resultados e datas.

## A regra de ouro: coerência

Se há exposição a ruído no S-2240, deve haver base clínica correspondente no PCMSO e registro no S-2220 quando exame for realizado. Divergência é red flag.

## Prazos e responsabilidade

Estabeleça fluxo entre RH, DP, SESMT e clínica ocupacional. Dados cadastrais errados (CPF, matrícula, CBO) são causa frequente de rejeição.

## Roteiro de validação mensal

1. Conferir admissões do mês (S-2220)
2. Revisar mudanças de função com impacto em exposição
3. Validar periódicos realizados vs. enviados
4. Cruzar amostra de S-2240 com laudos e PGR

## Quando pedir apoio especializado

Se houver muitas retificações, eventos rejeitados ou dúvida sobre agentes nocivos, busque revisão técnica antes da fiscalização — correção preventiva custa menos que multa.

Dominar S-2220 e S-2240 é dominar a rastreabilidade da SST. Isso protege empresa, colaborador e reputação do RH.`,
  },
  {
    title: "Exame demissional: quando é obrigatório e como não errar no desligamento",
    slug: "exame-demissional-obrigatorio",
    excerpt:
      "Tire dúvidas sobre prazos, casos de dispensa, pedido de demissão e como documentar corretamente o encerramento do vínculo.",
    category: "Exames ocupacionais",
    coverImage:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
    coverImageAlt: "Profissionais com equipamentos de segurança em obra",
    publishedAt: "2026-05-10T10:30:00.000Z",
    content: `O desligamento é um momento sensível — e o exame demissional costuma gerar dúvidas no RH. Entender a regra evita tanto omissão quanto gasto desnecessário.

## Finalidade do exame demissional

Registrar condições de saúde do trabalhador no momento do desligamento, especialmente quando há exposição a riscos relevantes. Complementa o histórico ocupacional.

## Quando considerar obrigatório

A necessidade depende de exposição a riscos, tempo desde o último exame clínico ocupacional e tipo de desligamento. A NR-07 traz critérios que devem ser interpretados com apoio do médico do trabalho.

## Erros comuns

- Ignorar demissional em funções com risco alto
- Realizar exame sem considerar último ASO válido
- Desligar sem atualizar documentação e eSocial
- Não comunicar colaborador sobre direito e agendamento

## Fluxo sugerido no RH

1. Abrir checklist de desligamento
2. Verificar função, riscos e data do último exame
3. Consultar necessidade de demissional com PCMSO/clínica
4. Agendar, arquivar ASO e registrar S-2220 quando aplicável

## Pedido de demissão x dispensa

Em ambos os casos, a análise técnica do exame deve ser feita. O RH precisa de critério documentado, não de improviso.

## Boas práticas de experiência do colaborador

Explique o motivo do exame, agende com clareza e mantenha tom respeitoso. Processo bem conduzido reduz conflito e protege a marca empregadora.

Desligamento organizado inclui SST. Tratar essa etapa com o mesmo rigor da admissão é sinal de governança madura.`,
  },
];
