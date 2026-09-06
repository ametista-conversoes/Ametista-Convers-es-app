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

## 1. Link de convite/recuperação de senha expirado
- Clicar num link de convite ou de "esqueci a senha" já expirado/já usado → antes disso podia deixar entrar no app mesmo assim (sessão antiga guardada no navegador); agora o app detecta o erro que o Supabase manda no fragmento da URL (`#error=access_denied&error_code=otp_expired...`), desloga de propósito e mostra um aviso pra pedir um novo link.
- Confirmar que um link válido (recém-recebido, não expirado) continua funcionando normalmente — não pode ter virado um falso positivo.

## 2. Fase 29 — Atividades filtradas por plano do cliente
- Teste de aceite do próprio pedido: Workflow de Atividades com item A (todos os planos marcados) e item B (só Dominação) — aplicar no Kanban/projeto de um cliente Validação cria só A; aplicar num cliente Dominação cria A e B.
- Cliente novo cadastrado já com um plano definido → gatilho automático do Workflow de Atividades padrão (`handle_new_client_activity_template`) já nasce filtrado certo pelo plano.
- Cliente cadastrado **sem** plano nenhum definido (campo vazio) → precisa continuar recebendo todos os itens do checklist padrão, sem quebrar o onboarding automático.
- Card do Workflow de Atividades (listagem) mostrando o resumo "N itens · M exclusivos de <plano>" batendo com o que foi marcado em cada item.

## 3. Reset de senha — redirecionamento (nunca confirmado como resolvido)
- Pedir "Esqueci minha senha", abrir o link recebido por e-mail, confirmar que cai em `/reset-password` (não em `/login`) e consegue trocar a senha de ponta a ponta. Ficou sem confirmação do usuário na última rodada — checar os Auth Logs do Supabase se repetir.

## 4. "Mudança de planos na Central de Informações" — reclamação ainda não esclarecida
- Ainda não sabemos exatamente o que quebra. Antes de virar um teste de aceite de verdade, precisa o usuário reproduzir e descrever: o que acontece ao mudar o campo Plano do cliente e clicar em Salvar (mensagem de erro? não salva? salva errado?).

## 5. Fase 30 — Tarefas do cliente separadas do Kanban interno
- **Atenção ao testar**: depois desse deploy, `/tasks` do Portal Cliente e o checklist de `/project` vão aparecer **vazios** pra todo cliente (a tabela nova `client_tasks` nasce sem nenhum dado) — isso é esperado, não é bug. Só volta a mostrar algo depois que o gestor aplicar um Workflow com destino "Tarefas do cliente" ou o próprio cliente criar uma tarefa avulsa.
- No diálogo "Aplicar Workflow", escolher o destino "Tarefas do cliente (aparece no Portal Cliente)" num cliente de teste → confirma que a tarefa aparece em `/tasks` do Portal Cliente e **não aparece** no Kanban interno.
- Criar uma tarefa direto no Kanban (ou aplicar com destino "Kanban") → confirma que **não aparece** em `/tasks` do cliente.
- `/client-tasks` (Portal Gestor) continua mostrando só as tarefas do Kanban, sem nenhuma mudança — essa página é internamente separada da Fase 30, não deveria mudar.
- Cliente criando uma tarefa avulsa pra si mesmo (botão "Nova tarefa" em `/tasks`) e marcando como concluída → confirma que grava/atualiza certo na tabela nova.

## 6. Fase 31 — Plataforma Escolhida (Meta/Google) pra clientes Validação
- Cliente Validação sem `chosen_platform` definido → só vê itens `comum` na aba Atividades, com um aviso pra definir a plataforma.
- Definir a plataforma (Meta ou Google) na Central de Informações → passa a ver `comum` + itens da plataforma escolhida; itens da outra plataforma não aparecem (nem escondidos visualmente — nem chegam a renderizar).
- Trocar de plataforma depois de já ter algum item concluído da plataforma antiga → aparece a confirmação avisando quantos itens concluídos vão sumir da vista antes de trocar de fato.
- Cliente Escala/Dominação → aba Atividades sem nenhuma mudança de comportamento (sem filtro, sem aviso, sem card de plataforma na Central de Informações).
- **Pendente de dado real**: os itens dos Workflows de Atividades já existentes ficaram todos marcados como `comum` (nenhum perde visibilidade) até o usuário mandar o conteúdo de `checklist-meta-google-validacao.md` pra marcar os itens reais como `meta`/`google`.

## 7. Fase 28 — Integrações via MCC (Google Ads) / Business Manager (Meta)
- **Bloqueado agora por config externa**: conectar o Google Ads (MCC) deu `Error 400: redirect_uri_mismatch` no Google mesmo com o Client ID e o redirect_uri conferidos e batendo — causa ainda não fechada; próximo passo é capturar a URL completa que o navegador manda pra `accounts.google.com/o/oauth2/v2/auth` (via barra de endereço ou aba Network) pra comparar o valor exato de `redirect_uri=` enviado.
- Configurações → Agência: conectar a conta administradora do Google Ads (MCC) e o Business Manager do Meta — cada um pelo próprio OAuth, uma única vez.
- Status muda pra "Conectado" nos dois; pro Meta, se a conta enxergar mais de 1 Business Manager, confirma que aparece o seletor manual.
- Ativos Digitais → "Conectar integração" num ativo de cliente (Google Ads ou Meta Ads) → precisa aparecer a lista de contas do cliente (via MCC/BM), **sem pedir login de novo**.
- Vincular uma conta escolhida da lista a um Ativo Digital → confirma que fica "Conectado".
- Rodar sincronização manual numa conexão nova (vinculada à conta da agência) **e** numa conexão antiga/legada (OAuth próprio por cliente) — os dois caminhos de token precisam continuar funcionando.
- Desconectar a conta administradora em Configurações → Agência.

## 8. Aprovações externas do Google/Meta — bloqueiam validação com dados reais de terceiros
- **Google Ads API "Basic Access"**: enquanto não aprovado, só dá pra testar com MCC de teste (contas vazias) — a Fase 28 (lado Google) e a sincronização de métricas reais (Fase 19.1) só validam de verdade depois disso.
- **Verificação de escopo sensível do Google (Forms)** + vídeo de demonstração enviado: pendente de review do Google.
- **Meta Business Verification**: sem ela, contas de anúncio de clientes de terceiros não funcionam de verdade no Meta Ads — só testável com a própria conta da agência até a aprovação sair.
