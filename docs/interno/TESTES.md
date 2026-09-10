# Ametista Conversões — Testes pendentes

> Lista viva de testes ao vivo ainda não confirmados pelo usuário. Diferente do
> `TASKS.md` (histórico de fases), aqui uma entrada **não fica marcada como
> feita** — ela é **apagada** assim que o teste for confirmado. Toda
> funcionalidade nova que precise de teste ao vivo entra aqui no momento em
> que é construída, antes de qualquer coisa ser esquecida.
>
> Ordem: **crescente de importância** — os testes mais simples/menor risco
> primeiro, os mais críticos (maior superfície, mais partes móveis, ou que
> bloqueiam outros testes) por último. Cada passo vira um checkbox — marca
> conforme confirma ao vivo; quando o item inteiro estiver marcado, apaga a
> seção (não deixa marcado pra sempre).

---

## 1. Arrastar-para-reordenar nos itens do Workflow de Atividades
- [X] Editar um Workflow de Atividades existente (ou criar um novo com vários itens) → confirma que dá pra arrastar pelo ícone (⠿) e reordenar os itens, igual já funciona nas etapas do Workflow Operacional.
- [X] Salvar depois de reordenar → confirma que a ordem nova é a que aparece depois no checklist do cliente (quando esse Workflow for aplicado).

## 2. Correção do card fantasma "0 de 0" em Atividades
- [X] Veio de um bug real: um cliente Validação com todos os itens ocultos pelo filtro de plataforma (Fase 31b) ficava com um card vazio "0 de 0 itens concluídos", sem nenhum item pra selecionar/apagar — os itens existiam no banco mas nunca renderizavam. Corrigido: fora do modo de seleção o card só aparece se tiver algo realmente visível; no modo de seleção, todos os itens aparecem (mesmo os ocultos), com um aviso, pra dar pra apagar.
- [X] Testar: com um cliente Validação que tenha só itens de uma plataforma diferente da escolhida (ou nenhuma escolhida), confirma que o card não aparece mais fora do modo de seleção; ativar "Selecionar" → confirma que os itens ocultos aparecem com o aviso roxo e dá pra apagar; depois de apagar tudo, o card some de vez (mesmo no modo de seleção).

## 3. Contas de teste do Google Ads agora aparecem na lista — PRECISA DE DEPLOY MANUAL DA EDGE FUNCTION
- [X] **Atenção**: igual da última vez, a Edge Function `integrations` só atualiza depois de rodar o deploy dela pelo Supabase (CLI `supabase functions deploy integrations` ou pelo painel) — não sobe sozinha com o `git push`.
- [X] **Segunda rodada (07/09)**: a primeira tentativa (`status = ENABLED OR test_account = true` dentro do GAQL) deu `Error in query: unexpected input OR` — GAQL não aceita `OR` no WHERE, só `AND`. Corrigido: tira o filtro do WHERE e faz a mesma lógica em JS depois de buscar sem filtro nenhum de status. Se rodar o deploy e continuar dando erro de query, me manda o texto exato de novo.
- [X] Causa do bug: conta de teste do Google Ads sempre vem com status "CLOSED" do lado do Google (por design, mesmo funcionando 100% pela API) — o filtro antigo só aceitava status "ENABLED", então excluía toda conta de teste da lista. Corrigido pra usar o campo `test_account` que o Google Ads tem especificamente pra isso.
- [X] Testar: com o MCC de teste conectado em Configurações → Agência, confirma que a seção "MCC(s) identificado(s)" agora mostra o nome do MCC de teste (não mais "(sem nome)") com uma etiqueta amarela "Conta de teste". No diálogo "Conectar integração" de um Ativo Digital (Google Ads), confirma que a conta de cliente de teste aparece na lista pra escolher, marcada "— conta de teste" no final do nome.
- [ ] Depois de vincular essa conta de teste a um Ativo Digital, o próximo passo natural é gravar o vídeo de demonstração pra verificação de escopo sensível do OAuth (mostrando conectar o MCC → escolher a conta → dado aparecendo) — não precisa mais esperar o Basic Access pra isso.

## 4. Link de convite/recuperação de senha expirado
- [ ] Clicar num link de convite ou de "esqueci a senha" já expirado/já usado → antes disso podia deixar entrar no app mesmo assim (sessão antiga guardada no navegador); agora o app detecta o erro que o Supabase manda no fragmento da URL (`#error=access_denied&error_code=otp_expired...`), desloga de propósito e mostra um aviso pra pedir um novo link.
- [ ] Confirmar que um link válido (recém-recebido, não expirado) continua funcionando normalmente — não pode ter virado um falso positivo.

## 5. Fase 29 — Atividades filtradas por plano do cliente
- [X] Teste de aceite do próprio pedido: Workflow de Atividades com item A (todos os planos marcados) e item B (só Dominação) — aplicar no Kanban/projeto de um cliente Validação cria só A; aplicar num cliente Dominação cria A e B.
- [ ] Cliente novo cadastrado já com um plano definido → gatilho automático do Workflow de Atividades padrão (`handle_new_client_activity_template`) já nasce filtrado certo pelo plano.
- [ ] Cliente cadastrado **sem** plano nenhum definido (campo vazio) → precisa continuar recebendo todos os itens do checklist padrão, sem quebrar o onboarding automático.
- [ ] Card do Workflow de Atividades (listagem) mostrando o resumo "N itens · M exclusivos de <plano>" batendo com o que foi marcado em cada item.

## 6. Reset de senha / convite — tela `/reset-password` quebrando com "Algo deu errado" (causa confirmada e corrigida, 10/09)
- [ ] **Causa real, achada em Configurações → Erros** (a entrada logada pelo próprio `ErrorBoundary` deu a resposta na hora — exatamente o caminho certo pra esse tipo de bug, ver Fase 21.1): `Error: useFormField should be used within <FormField>`. O bloco estático do campo "E-mail" em `ResetPassword.tsx` usava `<FormItem><FormLabel>...</FormLabel><FormControl>...</FormControl></FormItem>` sem estar dentro de um `<FormField>` — `FormLabel`/`FormControl` (shadcn) chamam um hook (`useFormField`) que só existe dentro do contexto que `<FormField>` provê (`FormItem` sozinho não basta, é um contexto diferente, só de geração de id). Por isso quebrava com QUALQUER link (normal ou expirado) — não tinha nada a ver com o Supabase, era um bug de render puro, sempre presente. Corrigido trocando esse bloco por `<Label>`/`<Input>` direto (campo só de exibição, nunca fez parte do `useForm`/`resetSchema` mesmo).
- [ ] Testar: pedir "Esqueci minha senha", abrir o link recebido por e-mail, confirmar que cai em `/reset-password` (não em `/login`) e consegue trocar a senha de ponta a ponta. Repetir com um convite de cliente novo (Central de Informações → Acesso ao Portal) e com um link expirado de propósito (esperar o link vencer ou usar um já usado) — confirma o aviso "link expirado" em vez da tela de erro.

## 7. "Mudança de planos na Central de Informações" — reclamação ainda não esclarecida
- [X] Ainda não sabemos exatamente o que quebra. Antes de virar um teste de aceite de verdade, precisa o usuário reproduzir e descrever: o que acontece ao mudar o campo Plano do cliente e clicar em Salvar (mensagem de erro? não salva? salva errado?).

## 8. Fase 30 — Tarefas do cliente separadas do Kanban interno
- [ ] **Atenção ao testar**: depois desse deploy, `/tasks` do Portal Cliente e o checklist de `/project` vão aparecer **vazios** pra todo cliente (a tabela nova `client_tasks` nasce sem nenhum dado) — isso é esperado, não é bug. Só volta a mostrar algo depois que o gestor aplicar um Workflow com destino "Tarefas do cliente" ou o próprio cliente criar uma tarefa avulsa.
- [ ] No diálogo "Aplicar Workflow", escolher o destino "Tarefas do cliente (aparece no Portal Cliente)" num cliente de teste → confirma que a tarefa aparece em `/tasks` do Portal Cliente e **não aparece** no Kanban interno.
- [ ] Criar uma tarefa direto no Kanban (ou aplicar com destino "Kanban") → confirma que **não aparece** em `/tasks` do cliente.
- [ ] `/client-tasks` (Portal Gestor) continua mostrando só as tarefas do Kanban, sem nenhuma mudança — essa página é internamente separada da Fase 30, não deveria mudar.
- [ ] Cliente criando uma tarefa avulsa pra si mesmo (botão "Nova tarefa" em `/tasks`) e marcando como concluída → confirma que grava/atualiza certo na tabela nova.

## 9. Fase 31/31b — Plataforma Escolhida (Meta/Google) pra clientes Validação
- [ ] No editor de item do Workflow de Atividades: confirma que agora tem 2 seções separadas de checkbox — "Plano" (Validação/Escala/Dominação) e "Plataforma" (Meta Ads/Google Ads), com as 2 de plataforma marcadas por padrão em item novo.
- [ ] Cliente Validação sem `chosen_platform` definido → só vê itens com as 2 plataformas marcadas (universal) na aba Atividades, com um aviso pra definir a plataforma.
- [ ] Definir a plataforma (Meta ou Google) na Central de Informações → passa a ver os universais + os exclusivos da plataforma escolhida; itens exclusivos da outra plataforma não aparecem (nem escondidos visualmente — nem chegam a renderizar).
- [ ] Trocar de plataforma depois de já ter algum item concluído exclusivo da plataforma antiga → aparece a confirmação avisando quantos itens concluídos vão sumir da vista antes de trocar de fato (itens universais não entram nessa conta, porque continuam aparecendo).
- [ ] Cliente Escala/Dominação → aba Atividades sem nenhuma mudança de comportamento (sem filtro, sem aviso, sem card de plataforma na Central de Informações).
- [ ] **Pendente de dado real**: os itens dos Workflows de Atividades já existentes ficaram todos com as 2 plataformas marcadas (universal, nenhum perde visibilidade) — o `checklist-meta-google-validacao.md` revelou que várias fases precisam de itens novos com texto diferente por plataforma (não só uma marcação), então a tagueação real precisa ser feita à mão pelo usuário, item por item, usando os checkboxes novos como referência o arquivo.

## 10. Fase 28 — Integrações via MCC (Google Ads) / Business Manager (Meta)
- [ ] O `redirect_uri_mismatch` de antes já foi resolvido (Client ID do Google Cloud Console estava desatualizado) — MCC conectando normalmente agora, com a seção nova de identificação do MCC (nome + id) em Configurações → Agência funcionando e mostrando o diagnóstico real quando alguma conta falha (ver item 11 — bloqueio confirmado do lado do Google, não do app).
- [ ] Configurações → Agência: conectar a conta administradora do Google Ads (MCC) e o Business Manager do Meta — cada um pelo próprio OAuth, uma única vez.
- [ ] Status muda pra "Conectado" nos dois; pro Meta, se a conta enxergar mais de 1 Business Manager, confirma que aparece o seletor manual.
- [ ] Ativos Digitais → "Conectar integração" num ativo de cliente (Google Ads ou Meta Ads) → precisa aparecer a lista de contas do cliente (via MCC/BM), **sem pedir login de novo**.
- [ ] Vincular uma conta escolhida da lista a um Ativo Digital → confirma que fica "Conectado".
- [ ] Rodar sincronização manual numa conexão nova (vinculada à conta da agência) **e** numa conexão antiga/legada (OAuth próprio por cliente) — os dois caminhos de token precisam continuar funcionando.
- [ ] Desconectar a conta administradora em Configurações → Agência.

## 11. Apagar projeto e mudar status direto na lista de Projetos
- [ ] Central de Informações do Cliente → card "Projetos": clicar no badge de status de um projeto (ex: "Planejamento") abre um menu com as 5 opções (Planejamento/Ativo/Pausado/Concluído/Cancelado) — confirma que muda na hora, sem precisar abrir o projeto.
- [ ] Clicar no ícone de lixeira ao lado do badge → confirma o diálogo de confirmação com o nome do projeto; "Apagar" remove o projeto da lista de vez. Se o projeto apagado tinha uma integração vinculada (Google Ads/Meta Ads), confirma que a conexão em si não some (só desvincula) — testar em cima de um projeto de teste sem dado importante.
- [ ] Cancelar no diálogo → projeto continua normalmente.

## 12. Tipo de conversão por projeto (Vendas/Leads) + Receita automática
- [ ] Criar um projeto novo → confirma que o campo "Tipo de conversão" aparece com Vendas/Leads, padrão "Leads".
- [ ] Projeto tipo "Vendas" vinculado a uma campanha real com o cliente tendo Ticket Médio configurado (Central de Informações) → aba Visão Geral mostra a Receita calculada automaticamente (Conversões × Ticket Médio), com o link "editar manualmente" pra sobrescrever se precisar.
- [ ] Projeto tipo "Leads" vinculado, com o cliente tendo Ticket Médio **e** Leads pra Fechar configurados → também calcula automático (Conversões ÷ Leads pra Fechar × Ticket Médio, mesma fórmula que a Receita da conta inteira já usava) — **não é só a Vendas que ganhou o automático, os dois tipos ganharam**; a diferença entre os tipos é só a fórmula. Sem os dois campos configurados no cliente, aí sim fica manual (mesmo comportamento de antes desta fase).
- [ ] Em qualquer um dos dois casos, editar manualmente uma vez faz o valor manual "vencer" pra sempre (não volta a calcular sozinho depois), mesmo que o número editado seja igual ao automático por coincidência.

## 13. Aba "Grupos de Anúncios" + Parcela de impressão perdida + Índice de Qualidade — PRECISA DE DEPLOY MANUAL DA EDGE FUNCTION
- [ ] **Atenção**: a Edge Function `integrations` só atualiza depois de rodar `supabase functions deploy integrations` (CLI ou painel) — não sobe sozinha com o `git push`. Sem o deploy, a aba nova só vai dar erro/lista vazia.
- [ ] Rodar as migrations `migration-062-tipo-campanha-projeto.sql` e `migration-063-impression-share-orcamento.sql` antes de testar (adicionam as colunas novas).
- [ ] Abrir um projeto vinculado a uma campanha real do Google Ads → aba nova "Grupos de Anúncios" mostra, no topo, Orçamento + as 2 métricas de parcela de impressão perdida (classificação/orçamento) da campanha; embaixo, um cartão por grupo de anúncios com Custo/Cliques/CTR/CPC méd./Taxa de Conversão/Índice de Qualidade.
- [ ] Numa campanha que não seja de Pesquisa (Display/Vídeo/PMax) → confirma que impressão perdida e índice de qualidade aparecem como "—" em vez de erro ou zero enganoso.
- [ ] Projeto sem campanha vinculada, ou vinculado a uma conexão que não seja Google Ads (Meta Ads) → aba mostra o aviso certo em vez de tentar buscar e quebrar.

## 14. Tipo de campanha, CPC médio, valor de conversão e resumos curados (dispositivo/geo/top termos/top keywords) — PRECISA DE DEPLOY MANUAL DA EDGE FUNCTION
- [ ] **Atenção**: a Edge Function `integrations` só atualiza depois de rodar `supabase functions deploy integrations` (CLI ou painel) — sem o deploy, o badge de tipo de campanha e a aba nova só vão dar erro/vazio.
- [ ] Rodar `migration-065-tipo-campanha-valor-conversao.sql` antes de testar.
- [ ] Projeto vinculado a uma campanha do Google Ads → aba Visão Geral mostra um badge novo com o tipo de campanha (Pesquisa/Display/Vídeo/Performance Max/...) e as tiles "CPC médio" e "Valor de conversão (plataforma)" — esse último é o valor de conversão que o próprio Google reporta, diferente da "Receita" do app (calculada por Leads/Ticket Médio); confirma que os dois números aparecem separados, sem se confundir.
- [ ] No topo da aba "Grupos de Anúncios", confirma a nova tile "Utilização de orçamento (30 dias)" ao lado das 2 de impressão perdida — é gasto real ÷ (orçamento diário × 30); bem abaixo de 100% pode ser orçamento sobrando, isso é só informativo interno (o cliente não vê essa aba).
- [ ] Abaixo da lista de grupos, confirma os blocos novos — "Dispositivo" (custo/cliques/conversões por Celular/Computador/Tablet), "Desempenho geográfico (cidade/região)", "Top termos de pesquisa", "Top palavras-chave", "Breakdown por ação de conversão" (ex: separar "Compra" de "Lead" quando o cliente rastreia mais de uma), uma frase "Melhor desempenho: [dia da semana], período da [manhã/tarde/noite/madrugada]" e, só quando existir dado, "Demográfico" (faixa etária + gênero).
- [ ] Numa campanha que não seja de Pesquisa (Display/Vídeo/PMax) → "Top termos de pesquisa" e "Top palavras-chave" devem aparecer vazios com a mensagem explicando o motivo, não um erro; "Demográfico" só aparece de verdade em campanhas com segmentação de público (Display/Vídeo/Demand Gen/PMax) — numa campanha de Pesquisa pura, a seção inteira some (sem bloco vazio/quebrado).
- [ ] Projeto vinculado a uma campanha do Meta Ads → confirma que só o badge de tipo de campanha (objetivo) e CPC/valor de conversão aparecem; a aba "Grupos de Anúncios" inteira (incluindo todos os blocos novos) mostra o aviso de "só Google Ads por enquanto", sem quebrar.

## 15. Múltiplas campanhas por projeto (project_campaign_links)
- [ ] Rodar `migration-066-multiplas-campanhas-projeto.sql` antes de testar — se algum projeto já tinha campanha vinculada (link único antigo), confirma que ela aparece automaticamente na lista nova depois de rodar a migration (é o backfill), sem precisar vincular de novo.
- [ ] Aba "Campanha" do projeto: "Campanhas vinculadas" agora é uma lista, com "Adicionar campanha" abrindo o mesmo fluxo de escolher conta → campanha de antes, e "Remover" em cada linha já vinculada.
- [ ] Vincular 2 campanhas ao mesmo projeto (idealmente de tipos diferentes, ex: Search + Performance Max) → aba Visão Geral mostra os badges de tipo de campanha das duas, e CPA/CTR/Gasto/Receita passam a somar as duas juntas.
- [ ] Aba "Grupos de Anúncios" → confirma uma seção por campanha vinculada, cada uma com seu próprio orçamento/impressão perdida/ad groups/resumos curados — não uma lista só misturando tudo.
- [ ] Criar um projeto novo já escolhendo uma campanha na hora da criação → confirma que ela aparece certinho na lista de "Campanhas vinculadas" depois (não só nas 3 colunas antigas, que não são mais lidas em lugar nenhum).
- [ ] Remover a única campanha vinculada de um projeto → volta a mostrar "Nenhuma campanha vinculada" e os campos da Visão Geral voltam a usar os valores manuais do projeto (spend/cpa/ctr/revenue).

## 16. Alerta automático de mudança de estado da campanha — PRECISA DE DEPLOY MANUAL DA EDGE FUNCTION
- [ ] **Atenção**: `supabase functions deploy integrations` de novo — sem o deploy, o status/orçamento novo não é sincronizado e o alerta nunca dispara.
- [ ] Rodar `migration-067-alerta-mudanca-estado-campanha.sql` antes de testar.
- [ ] Com uma campanha de teste vinculada a um projeto: rodar uma sincronização (pra gravar o 1º status conhecido), depois pausar essa campanha direto no Google Ads/Meta Ads, rodar a sincronização de novo → confirma que aparece um Alerta novo em `/alerts` do tipo "Campanha "X" mudou de estado" (severidade alta se removida, média se pausada).
- [ ] Rodar a sincronização uma 3ª vez sem mudar nada → confirma que **não** cria um alerta duplicado pra mesma transição (o último status conhecido já foi atualizado).
- [ ] Mudar o orçamento diário da campanha de teste em mais de 20% (pra cima ou pra baixo) e sincronizar → confirma o alerta "Orçamento da campanha mudou bruscamente".
- [ ] Reverter a campanha pra ENABLED e sincronizar → não deve criar alerta nenhum (só PAUSED/REMOVED disparam, não o retorno ao normal).

## 17. Tipo de campanha/status/orçamento agora sincroniza mesmo sem gasto real — PRECISA DE DEPLOY MANUAL DA EDGE FUNCTION
- [ ] **Atenção**: `supabase functions deploy integrations` de novo.
- [ ] Veio de um bug real que você reportou: campanha de teste do Google Ads vinculada a um projeto não mostrava o badge de tipo (Search/PMax/etc.), mesmo já linkada corretamente — porque a consulta de métricas só grava linha pra campanha+dia com atividade real, e conta de teste normalmente tem zero atividade.
- [ ] Testar: com aquela mesma campanha de teste (ex: "Sales-Search-2") vinculada a um projeto, rodar a sincronização → confirma que agora o badge de tipo aparece na Visão Geral mesmo com Gasto R$ 0,00.

## 18. Teste A/B de Campanhas (aba "Testes")
- [ ] Rodar `migration-068-teste-ab-campanhas.sql` antes de testar.
- [ ] Criar (ou editar) um projeto com "Tipo de teste A/B" diferente de "Nenhum" → confirma que aparece a aba "Testes" e o badge roxo "Teste A/B — [tipo]" na Visão Geral.
- [ ] Com pelo menos 2 campanhas vinculadas na aba Campanha: aba Testes mostra um cartão por campanha (variante) com nome/ID/tipo, "vinculada há X dias", Gasto/CPA/CTR/Taxa de Conversão.
- [ ] Configurar um "Gasto mínimo" (ex: R$100) → variante com gasto abaixo disso fica marcada "Dados insuficientes" e some do cálculo da média do grupo (mas continua aparecendo na lista).
- [ ] Com pelo menos 2 variantes elegíveis: confirma que a variante com CPA mais baixo (ou CTR/Taxa de Conversão mais alta) que a média do grupo fica destacada em verde com uma setinha — pode ter mais de uma destacada ao mesmo tempo, não é uma "vencedora" única.
- [ ] Tipo de teste "Segmentação" → cada variante mostra um resumo extra (dispositivo/local/faixa etária/gênero top), reaproveitando o mesmo dado da aba Grupos de Anúncios.
- [ ] Tipo de teste "Anúncio" → cada variante mostra um log manual; "Registrar" abre data + descrição livre, salva e aparece na lista; confirma que dá pra apagar um registro errado.
- [ ] Tipo de teste "Campanha" → só mostra a comparação de métricas, sem seção extra nenhuma.
- [ ] Projeto com só 1 campanha vinculada (ou nenhuma) e tipo de teste configurado → aba Testes mostra aviso pra vincular mais uma, em vez de comparar sozinho ou quebrar.

## 19. Catálogo de Criativos e Segmentações (Central de Informações do Cliente)
- [ ] Rodar `migration-069-catalogo-criativos-segmentacoes.sql` antes de testar.
- [ ] Central de Informações do Cliente → confirma que aparecem os 2 cards novos, "Catálogo de Criativos" e "Catálogo de Segmentações", cada um sempre restrito àquele cliente (sem opção de reaproveitar entrada de outro cliente).
- [ ] "Adicionar" no Catálogo de Criativos → formulário com Tipo (Texto/Vídeo), Conteúdo (texto do anúncio ou caminho do arquivo de vídeo — confirma que o placeholder muda ao trocar pra Vídeo), Origem (IA/Forms/Manual), Prioridade (Alta/Média/Baixa) e "Variação de" opcional → salva e aparece em "Em Triagem" com status Rascunho.
- [ ] "Adicionar" no Catálogo de Segmentações → mesmo formulário, sem o campo Tipo (não existe distinção texto/vídeo pra segmentação).
- [ ] Clicar no badge de Prioridade ou de Status de uma entrada → menu abre e troca na hora, sem recarregar a página.
- [ ] Marcar uma entrada como "Aprovado/Implementado" → confirma que ela some da aba "Em Triagem" e passa a aparecer em "Confirmados/Implementados".
- [ ] Marcar uma entrada como "Descartado" → some das 2 abas principais; confirma que aparece em "Mostrar descartados (N)" no rodapé do card, sem se perder.
- [ ] Criar uma 2ª entrada escolhendo a 1ª em "Variação de" → confirma que a 2ª mostra "↳ variação de: [texto da 1ª]" na lista.
- [ ] Com um projeto que já tenha "Tipo de teste A/B" configurado (Fase 33) e pelo menos 2 campanhas vinculadas: numa entrada do catálogo, confirma que o seletor "Vincular a Grupo de Teste" lista esse projeto + a campanha; vincular e marcar a entrada como "Em Teste" → confirma que aparece o resultado herdado (CPA/CTR/Taxa de Conversão com a setinha verde quando bate a média do grupo), igual à aba Testes do projeto.
- [ ] Projeto sem nenhum "Tipo de teste A/B" configurado → confirma que não aparece na lista do seletor "Vincular a Grupo de Teste" (só projetos com teste configurado têm Grupo de Teste de verdade).
- [ ] Apagar uma entrada (ícone de lixeira) → confirma que some da lista na hora, sem confirmação extra (mesmo padrão do log de troca de anúncio da Fase 33).

## 20. Reenviar convite pendente + badge "Convite pendente" (Central de Informações do Cliente → Acesso ao Portal)
- [ ] Veio de um pedido do usuário: convidar um e-mail novo criava a conta na hora (comportamento inerente do Supabase — é assim que ele sabe pra quem mandar o link), mas tentar convidar de novo o mesmo e-mail (ex: convite perdido/expirado) não reenviava nada — a conta já existia nesse ponto, então o botão só revinculava em silêncio, sem mandar e-mail.
- [ ] Convidar um e-mail novo → confirma que a conta aparece na lista com o badge amarelo "Convite pendente" (a pessoa ainda não terminou de escolher a senha em `/reset-password`) e um botão "Reenviar convite" ao lado de "Remover acesso".
- [ ] Clicar em "Reenviar convite" → confirma que um novo e-mail chega, e que o botão vira "Aguarde 20s" (contando regressivamente) por 20 segundos antes de poder clicar de novo.
- [ ] Depois que a pessoa completa `/reset-password` de verdade (escolhe nome + senha) → confirma que o badge "Convite pendente" e o botão "Reenviar convite" somem da lista (só restou "Remover acesso").
- [ ] Tentar reenviar convite de uma conta que já está confirmada (sem o botão aparecer, isso não deveria nem ser possível pela UI) → se forçado direto na Edge Function, confirma que devolve erro 409 explicando pra usar "Esqueci minha senha" em vez disso.

## 21. Workflows do Cliente agora gravam em client_tasks (antes iam pro Kanban, nunca apareciam pro cliente)
- [ ] Rodar `migration-070-corrige-workflows-cliente-tarefas.sql` antes de testar.
- [ ] **Bug real reportado pelo usuário**: a página Workflows → aba "Workflows do Cliente" foi construída especificamente pra mandar tarefa direto pra aba "Tarefas" do Portal Cliente (o próprio texto do diálogo já dizia isso) — mas a função `apply_client_workflow` (de antes da Fase 30 existir) nunca foi atualizada pra gravar em `client_tasks`, sempre gravou em `public.tasks` (Kanban interno da agência). Resultado: aplicar um Workflow do Cliente nunca aparecia pro cliente de jeito nenhum, mesmo a agência vendo a mensagem de sucesso.
- [ ] Testar: Workflows → aba "Workflows do Cliente" → criar/usar um modelo → "Aplicar a clientes" → marcar um cliente de teste → Aplicar. Logar como esse cliente (ou pedir pra ele conferir) → confirma que as tarefas aparecem em `/tasks` do Portal Cliente, em Backlog.
- [ ] **Mudança de escopo pedida junto**: o "Workflow Operacional" (Workflows → aba "Operacional", ou "Aplicar Workflow" na Central de Informações do Cliente) perdeu a opção de destino "Tarefas do cliente (aparece no Portal Cliente)" — agora só cria tarefas internas do Kanban (com ou sem projeto vinculado). "Workflows do Cliente" passa a ser o único caminho pra mandar tarefa pro Portal Cliente. Testar: no diálogo "Aplicar Workflow Operacional", confirma que só aparecem as opções "Tarefas de um projeto" e "Tarefas do Kanban" — nada de Portal Cliente ali.
- [ ] **Ainda a confirmar pelo usuário**: se isso também explica o relato "mandei uma tarefa e ela apareceu por um momento e depois desapareceu" — não reproduzi isso especificamente, só a causa mais provável (aplicar via um caminho que ia pro Kanban enquanto se esperava ver no Portal Cliente). Se o sumiço continuar acontecendo mesmo depois desse fix, precisa descrever de novo qual tela/botão exato foi usado.

## 22. Aprovações externas do Google/Meta — bloqueiam validação com dados reais de terceiros
- [ ] **Google Ads API "Basic Access" — CONFIRMADO (07/09), não é mais suspeita**: o diagnóstico novo (item 10) mostrou o erro real do Google nas 4 contas raiz que o MCC "Ametista Conversões" enxerga: `"The developer token is only approved for use with test accounts. To access non-test accounts, apply for Basic or Standard access."` — ou seja, o developer token do app só pode mexer em contas de teste (vazias) até essa aprovação sair; nenhuma conta de cliente de verdade funciona antes disso, não importa o quanto o vínculo no MCC esteja certo. **Não é bug de código, é aprovação que só o Google concede** — peça em Google Ads → Ferramentas e Configurações → Configuração → API Center, dentro da conta MCC. A Fase 28 (lado Google) e a sincronização de métricas reais (Fase 19.1) só validam de verdade depois disso.
- [ ] Duas das 4 contas também deram um segundo erro, independente do developer token: `"The customer account can't be accessed because it is not yet enabled or has been..."` — sugere que essas 2 contas específicas têm o próprio setup incompleto do lado do Google (ex: sem faturamento configurado) — vale conferir direto no Google Ads, mas só faz sentido investigar isso depois que o Basic Access sair, já que sem ele nada funciona de qualquer forma.
- [ ] **Verificação de escopo sensível do Google (Forms)** + vídeo de demonstração enviado: pendente de review do Google.
- [ ] **Meta Business Verification**: sem ela, contas de anúncio de clientes de terceiros não funcionam de verdade no Meta Ads — só testável com a própria conta da agência até a aprovação sair.
