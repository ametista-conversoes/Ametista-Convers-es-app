// Lista curada e pragmática de stopwords do português — não é
// linguisticamente exaustiva, só o suficiente pra tirar do topo as
// palavras de ligação mais comuns e deixar sobrar o que tem
// significado (Fase 8.4, "Comunicação Persuasiva").
const STOPWORDS = new Set([
  'a', 'ao', 'aos', 'aquela', 'aquelas', 'aquele', 'aqueles', 'aquilo', 'as', 'até', 'com', 'como', 'da', 'das',
  'de', 'dela', 'delas', 'dele', 'deles', 'depois', 'do', 'dos', 'e', 'ela', 'elas', 'ele', 'eles', 'em', 'entre',
  'era', 'essa', 'essas', 'esse', 'esses', 'esta', 'está', 'estamos', 'estão', 'estas', 'este', 'esteja', 'estes',
  'estou', 'eu', 'foi', 'fomos', 'for', 'foram', 'isso', 'isto', 'já', 'lhe', 'lhes', 'mais', 'mas', 'me', 'mesmo',
  'meu', 'meus', 'minha', 'minhas', 'muito', 'muita', 'muitos', 'muitas', 'na', 'não', 'nas', 'nem', 'no', 'nos',
  'nossa', 'nossas', 'nosso', 'nossos', 'num', 'numa', 'ou', 'para', 'pela', 'pelas', 'pelo', 'pelos',
  'por', 'qual', 'quando', 'que', 'quem', 'se', 'sem', 'ser', 'seu', 'seus', 'só', 'somos', 'sua', 'suas', 'são',
  'também', 'te', 'tem', 'têm', 'tinha', 'tive', 'tu', 'tua', 'tuas', 'um', 'uma', 'umas', 'uns', 'você', 'vocês',
  'sim', 'the', 'and', 'for', 'sobre', 'ainda', 'assim', 'todo', 'toda', 'todos', 'todas',
])

export interface WordFrequency {
  word: string
  count: number
  percentage: number
}

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
  return new Set(words)
}

/** Palavras mais frequentes num conjunto de respostas abertas (Fase
 * 8.4, "Comunicação Persuasiva") — função pura, sem depender do
 * Supabase, pra dar pra testar com dado sintético. Conta uma palavra
 * só 1 vez por resposta (mesmo se repetir várias vezes no mesmo
 * texto), pra `percentage` significar "% das respostas que usaram
 * essa palavra" — mesma semântica já usada nas perguntas fechadas de
 * caixa de seleção, não "quantas vezes no total" (o que deixaria uma
 * resposta repetitiva dominar o resultado). Formato de saída
 * (`label`/`count`/`percentage`, aqui como `word`) é compatível com
 * `OptionBreakdownBarChart`. */
export function extractWordFrequency(answers: string[], topN = 20): WordFrequency[] {
  const total = answers.length
  const counts = new Map<string, number>()

  for (const answer of answers) {
    for (const word of tokenize(answer)) {
      counts.set(word, (counts.get(word) ?? 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count, percentage: total > 0 ? (count / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
}
