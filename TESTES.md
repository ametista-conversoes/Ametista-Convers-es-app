# Ametista Conversões — Testes pendentes

> Lista viva de testes ao vivo ainda não confirmados pelo usuário. Diferente do
> `TASKS.md` (histórico de fases), aqui uma entrada **não fica marcada como
> feita** — ela é **apagada** assim que o teste for confirmado. Toda
> funcionalidade nova que precise de teste ao vivo entra aqui no momento em
> que é construída, antes de qualquer coisa ser esquecida.
>
> Ordem: **crescente de importância** — os testes mais simples/menor risco
> primeiro, os mais críticos (maior superfície, mais partes móveis, ou que
> bloqueiam outros testes) por último.

---

## 1. Kanban e Atividades — modo de seleção múltipla pra apagar
- Nas duas telas: clicar na lixeira do cabeçalho → cada card/linha ganha a própria lixeira; clicar nela marca o item (fica avermelhado), sem apagar nada ainda e sem abrir popup.
- Clicar de novo na lixeira do cabeçalho com pelo menos 1 marcado → abre popup "Apagar N tarefas/itens?"; confirmar apaga todos os marcados de uma vez.
- Clicar de novo na lixeira do cabeçalho sem nada marcado → só desliga o modo de seleção, sem popup.
- Kanban: confirmar que arrastar um card entre colunas continua desativado enquanto o modo de seleção estiver ligado.

## 2. Apagar cliente — 2 causas de 409 corrigidas
- Apagar um cliente que **tem** uma conta de acesso vinculada (Fase 26) → antes travava (FK sem `on delete` em `profiles.client_id`, migration-055); depois de apagado, a conta de login continua intacta, só desvinculada.
- Apagar um cliente que tenha **Meta SMART, Reunião, Ativo Digital, Incidente ou Alerta** → também travava com 409 Conflict, causa diferente: os gatilhos de log de exclusão dessas 5 tabelas tentavam gravar um `audit_logs` novo referenciando o cliente, mas nesse momento do cascade o cliente já tinha sido removido — violava a própria FK (`migration-057`). Testar apagando um cliente de teste que tenha pelo menos um item de cada uma dessas 5 categorias.
- Confirmar que apagar isoladamente uma Meta/Reunião/Ativo/Incidente/Alerta (sem apagar o cliente inteiro) continua gerando o registro normal em Timeline/Auditoria, sem mudança de comportamento.

## 4. Fase 29 — Atividades filtradas por plano do cliente
- Teste de aceite do próprio pedido: Workflow de Atividades com item A (todos os planos marcados) e item B (só Dominação) — aplicar no Kanban/projeto de um cliente Validação cria só A; aplicar num cliente Dominação cria A e B.
- Cliente novo cadastrado já com um plano definido → gatilho automático do Workflow de Atividades padrão (`handle_new_client_activity_template`) já nasce filtrado certo pelo plano.
- Cliente cadastrado **sem** plano nenhum definido (campo vazio) → precisa continuar recebendo todos os itens do checklist padrão, sem quebrar o onboarding automático.
- Card do Workflow de Atividades (listagem) mostrando o resumo "N itens · M exclusivos de <plano>" batendo com o que foi marcado em cada item.

## 5. Reset de senha — redirecionamento (nunca confirmado como resolvido)
- Pedir "Esqueci minha senha", abrir o link recebido por e-mail, confirmar que cai em `/reset-password` (não em `/login`) e consegue trocar a senha de ponta a ponta. Ficou sem confirmação do usuário na última rodada — checar os Auth Logs do Supabase se repetir.

## 6. "Mudança de planos na Central de Informações" — reclamação ainda não esclarecida
- Ainda não sabemos exatamente o que quebra. Antes de virar um teste de aceite de verdade, precisa o usuário reproduzir e descrever: o que acontece ao mudar o campo Plano do cliente e clicar em Salvar (mensagem de erro? não salva? salva errado?).

## 7. Fase 28 — Integrações via MCC (Google Ads) / Business Manager (Meta)
- Configurações → Agência: conectar a conta administradora do Google Ads (MCC) e o Business Manager do Meta — cada um pelo próprio OAuth, uma única vez.
- Status muda pra "Conectado" nos dois; pro Meta, se a conta enxergar mais de 1 Business Manager, confirma que aparece o seletor manual.
- Ativos Digitais → "Conectar integração" num ativo de cliente (Google Ads ou Meta Ads) → precisa aparecer a lista de contas do cliente (via MCC/BM), **sem pedir login de novo**.
- Vincular uma conta escolhida da lista a um Ativo Digital → confirma que fica "Conectado".
- Rodar sincronização manual numa conexão nova (vinculada à conta da agência) **e** numa conexão antiga/legada (OAuth próprio por cliente) → os dois caminhos de token precisam continuar funcionando.
- Desconectar a conta administradora em Configurações → Agência.

## 8. Aprovações externas do Google/Meta — bloqueiam validação com dados reais de terceiros
- **Google Ads API "Basic Access"**: enquanto não aprovado, só dá pra testar com MCC de teste (contas vazias) — a Fase 28 (lado Google) e a sincronização de métricas reais (Fase 19.1) só validam de verdade depois disso.
- **Verificação de escopo sensível do Google (Forms)** + vídeo de demonstração enviado: pendente de review do Google.
- **Meta Business Verification**: sem ela, contas de anúncio de clientes de terceiros não funcionam de verdade no Meta Ads — só testável com a própria conta da agência até a aprovação sair.
