# Ametista Conversões

Plataforma de gestão para agências de marketing de performance, usada pela **Ametista Conversões** para centralizar a operação com seus clientes — não é um CRM, não é uma plataforma de automação de marketing, e não substitui o Google Ads/Meta Ads: ela organiza o trabalho da agência em torno das contas que já existem nessas plataformas.

> **Summary in English**: Ametista Conversões is a SaaS operations platform used internally by a Brazilian digital-marketing agency (Ametista Conversões) to manage client projects, tasks, approvals, meetings and ad-campaign reporting in one place. It integrates with the Google Ads and Meta Ads APIs, connected once through the agency's own manager account (MCC / Business Manager), to display each client's own aggregate campaign metrics (spend, clicks, impressions, conversions) inside the agency's dashboard — see [Integração com Google Ads e Meta Ads](#integração-com-google-ads-e-meta-ads) below for scope and data-use details.

- **App**: https://ametistaconversoes.app
- **Política de Privacidade**: https://ametistaconversoes.app/privacy
- **Termos de Uso**: https://ametistaconversoes.app/terms
- **Contato**: ametistaconversoes@gmail.com

## O que é

Dois portais, um app só:

- **Portal do Cliente**: dashboard de desempenho, projeto, tarefas, arquivos e aprovações, reuniões, relatórios e um assistente de IA (Cassie) pra tirar dúvidas sobre a própria campanha.
- **Portal do Gestor**: visão executiva de todos os clientes, kanban interno, workflows reutilizáveis, incidentes, ativos digitais, alertas automáticos de métrica, metas SMART e onboarding — tudo isolado por cliente.

## Integração com Google Ads e Meta Ads

A agência conecta sua própria conta administradora (**MCC** no Google Ads, **Business Manager** no Meta) uma única vez, via OAuth. A partir daí:

1. O vínculo entre a conta de anúncios de cada cliente e o MCC/Business Manager da agência é feito **manualmente, antes, dentro do próprio Google Ads/Meta** — o app nunca solicita acesso a uma conta que a agência não administra.
2. Dentro do app, o gestor escolhe numa lista qual conta (já vinculada) pertence a qual cliente — sem precisar de um novo login.
3. O app lê métricas agregadas de campanha (investimento, cliques, impressões, conversões) pra exibir num dashboard de desempenho, tanto pro gestor quanto pro próprio cliente daquela conta.

O app **nunca** lê dado pessoal de quem viu ou clicou num anúncio — só o agregado da campanha. Mais detalhes de uso de dado em [`/privacy`](https://ametistaconversoes.app/privacy).

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS + shadcn/ui (Radix UI) |
| Dados/cache | TanStack Query |
| Formulários | react-hook-form + zod |
| Backend | Supabase (Postgres + Auth + Storage + Edge Functions) |
| Deploy | Vercel (frontend) + Supabase (Edge Functions) |
| Testes | Vitest (unitário) + Playwright (end-to-end) |

Todas as tabelas com dado de cliente têm Row Level Security habilitado no Postgres — um cliente só enxerga o que é dele, gestores e admins têm acesso operacional, e chaves de API/tokens de OAuth ficam em Edge Functions com service role, nunca expostas no frontend.

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencher com as próprias credenciais do Supabase
npm run dev
```

```bash
npm run test    # testes unitários (Vitest)
npm run build   # type-check + build de produção
```

Esse repositório é do código-fonte do produto da Ametista Conversões — não aceita contribuição externa, mas é público pra fins de transparência e verificação (ex: revisão de acesso a API do Google Ads).
