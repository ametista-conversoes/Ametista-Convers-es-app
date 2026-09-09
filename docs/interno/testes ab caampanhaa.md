# Teste A/B de Campanhas — especificação final

## Objetivo

Permitir que um projeto seja marcado como um teste A/B, usando as campanhas do Google Ads já vinculadas a ele como variantes, e comparar o desempenho entre elas pra identificar o que performou melhor — segmentação, anúncio, ou a campanha como um todo.

## O que muda no Projeto

- Novo campo `tipo_teste`: nenhum / segmentação / anúncio / campanha
- Selecionável tanto na **criação** do projeto quanto na tela de **edição** depois
- Quando `tipo_teste` for diferente de "nenhum", o projeto ganha uma nova aba: **Testes**

## A aba Testes

Lista cada campanha vinculada ao projeto como uma "variante", mostrando:

- **Identificação completa**: nome da campanha, ID, tipo de anúncio (Search/PMax/etc.) — pra você sempre saber exatamente onde cada resultado está, sem depender de decorar IDs
- Se `tipo_teste = segmentação`: a segmentação básica configurada (público/localização) e os dados que a API já retorna sobre ela — sem detalhamento demográfico extra, como você confirmou que não precisa
- Gasto acumulado e tempo ativo de cada variante
- Métricas principais: CPA, CTR, taxa de conversão (médias no período)

## Elegibilidade pra comparação

- Cada variante só entra no ranking se tiver atingido um **gasto mínimo configurável** — deixo isso como uma configuração ajustável por você, não um valor fixo no código, já que você mesmo ficou em dúvida entre R$100 e R$1.000 (o ideal pode variar de cliente pra cliente)
- Variante abaixo do limiar aparece na lista, mas marcada como "dados insuficientes" em vez de entrar na comparação

## Como o destaque é calculado

- Calcula a média de cada métrica entre todas as variantes elegíveis daquele teste
- Essa média é **interna ao próprio grupo testado** — não uma referência de "mercado" externa (não existe hoje uma fonte confiável de benchmark externo pra puxar isso, então usar a média do próprio teste é o que realmente dá pra fazer)
- Variantes que superam essa média ficam marcadas como "acima da média" — pode haver mais de uma marcada, não é uma coroa única em cima de um único ID vencedor

## Log de troca de anúncio (só quando `tipo_teste = anúncio`)

- Dentro de cada campanha vinculada, você pode registrar manualmente: data + descrição livre ("troquei pra anúncio com CTA X")
- É um registro manual seu — o app não verifica nem sincroniza o conteúdo do anúncio via API
- Serve como histórico/contexto na linha do tempo da campanha. Se no futuro isso não bastar e você quiser que a média seja recalculada automaticamente por período entre trocas, dá pra evoluir depois — começar simples evita complicar antes de saber se é necessário

## O que o app não faz

- Não cria, edita ou consolida a campanha final vencedora no Google Ads — isso continua manual, por você, no Gerenciador de Anúncios
- Não verifica automaticamente se a variável "constante" (o que devia ficar igual entre as variantes) realmente ficou igual — isso é uma declaração de confiança sua ao montar o teste

## Modelo de dados (resumo pra Claude Code)

- `Project`: + campo `tipo_teste` (enum: nenhum/segmentacao/anuncio/campanha)
- Vínculo projeto↔campanha já existente: base das variantes do teste
- Nova tabela `campaign_ad_change_log`: campaign_id, data, descrição (texto livre)
- Métricas de comparação calculadas em cima do `campaign_performance_snapshots` já existente — sem sincronização nova
- Novo campo de configuração: limiar mínimo de gasto pra elegibilidade (numérico, editável, com valor sugerido mas não travado)

---

**Duas suposições que fiz e que você pode corrigir:**

1. Simplifiquei pra **um projeto = um teste** (uma variável testada por vez), em vez de permitir vários "grupos de teste" separados dentro do mesmo projeto. Pela sua descrição foi o que entendi, e é mais simples — mas se você quiser testar segmentação em algumas campanhas E anúncio em outras dentro do mesmo projeto ao mesmo tempo, me avisa que isso muda a estrutura.
2. Não incluí o campo de texto livre de "aprendizado" que eu tinha sugerido antes, já que sua resposta foi na direção de identificação completa (campanha/anúncio/tipo) em vez disso. Se ainda quiser esse campo além do resto, é fácil encaixar.