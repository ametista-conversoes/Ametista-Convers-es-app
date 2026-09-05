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

## 2. Apagar cliente com conta de login vinculada (correção de FK)
- Apagar um cliente que **tem** uma conta de acesso vinculada (Fase 26) → antes travava com "Não foi possível excluir o cliente" (FK sem `on delete` em `profiles.client_id`); agora precisa apagar o cliente normalmente e deixar a conta de login intacta, só desvinculada (some da lista de contas vinculadas, sem apagar o usuário/login em si).
- Depois de apagado, essa conta consegue logar normalmente (só não cai mais em nenhum Portal Cliente até ser vinculada de novo a outro cliente).

## 3. Ordem de aplicação de Workflows de Atividades vinculados
- Editar um Workflow Operacional com 2+ Workflows de Atividades vinculados → aparece uma lista "Ordem de aplicação" arrastável, abaixo dos checkboxes, refletindo a ordem atual do vínculo.
- Reordenar essa lista (arrastar), salvar, e aplicar o Workflow Operacional num cliente → os itens de Atividades precisam nascer na aba Atividades na mesma ordem escolhida (o primeiro da lista aparece primeiro), sem misturar com os itens do segundo workflow.
- Causa raiz corrigida: `apply_workflow` reiniciava o `step_order` do zero pra cada Workflow de Atividades do array, então 2+ workflows vinculados colidiam no mesmo `step_order` e a ordem exibida virava imprevisível — agora usa um contador único contínuo pra todos, na ordem do array.

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
