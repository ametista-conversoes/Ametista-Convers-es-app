// Ametista Conversões — Fase 11c.4: listener de notificação push.
//
// Injetado dentro do service worker gerado pelo vite-plugin-pwa via
// `workbox.importScripts` (vite.config.ts) — roda no mesmo escopo
// global do sw.js, então `self` aqui é o service worker inteiro.
// Arquivo JS puro de propósito (sem TypeScript/bundler): importScripts
// só aceita um arquivo já pronto, sem passo de build.

self.addEventListener('push', (event) => {
  let payload = { title: 'Ametista Conversões', body: '', url: '/' }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch {
    // payload inesperado (não-JSON) — mantém o texto padrão acima
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag,
      data: { url: payload.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        const clientUrl = new URL(client.url)
        if (clientUrl.origin === self.location.origin && 'focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    }),
  )
})
