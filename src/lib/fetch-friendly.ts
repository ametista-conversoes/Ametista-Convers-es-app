/** `fetch()` que rejeita com uma mensagem legível em vez do "Failed to
 * fetch"/"Load failed" cru do navegador — acontece sobretudo no celular,
 * quando a tela bloqueia ou o app perde foco no meio de uma requisição
 * demorada (chat da Cassie, Comunicação Persuasiva, conectar/desconectar
 * integrações) e o navegador cancela a conexão sozinho. Não corrige a
 * causa (isso é comportamento do navegador/SO, não bug do app), só evita
 * expor o texto técnico pro usuário. */
export async function fetchFriendly(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch {
    throw new Error('Falha de conexão — confira sua internet e tente de novo. Se a tela bloqueou durante o carregamento, isso também pode ter cortado a conexão.')
  }
}
