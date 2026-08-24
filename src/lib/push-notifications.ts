import { supabase } from '@/lib/supabase'

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** Detecção simples só pra mostrar o aviso certo — iOS/iPadOS exige o
 * PWA instalado na tela de início (modo standalone) pra push funcionar,
 * mesmo com tudo certo no código; Safari "de aba normal" nunca entrega. */
export function isLikelyIosOutsideStandalone() {
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
  return isIos && !isStandalone
}

/** Web Push exige a chave pública VAPID como bytes crus (Uint8Array),
 * não como a string base64url que o `npx web-push generate-vapid-keys`
 * imprime — conversão padrão documentada pela própria spec do Push API. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const bytes = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) bytes[i] = rawData.charCodeAt(i)
  return bytes
}

/** `navigator.serviceWorker.ready` normalmente resolve rápido, mas em
 * alguns navegadores/perfis (visto na prática) pode nunca resolver —
 * sem esse limite, a tela de Configurações ficava presa em
 * "Verificando..." pra sempre, sem nenhum jeito de sair daquilo. */
function serviceWorkerReadyWithTimeout(ms = 8000): Promise<ServiceWorkerRegistration> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Tempo esgotado esperando o service worker ficar pronto')), ms)
    navigator.serviceWorker.ready.then((registration) => {
      clearTimeout(timer)
      resolve(registration)
    }, reject)
  })
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  try {
    const registration = await serviceWorkerReadyWithTimeout()
    return await registration.pushManager.getSubscription()
  } catch (err) {
    console.warn('Não foi possível checar a inscrição de push:', err)
    return null
  }
}

/** Pede permissão, assina no navegador e salva a inscrição — upsert por
 * (user_id, endpoint), igual o padrão já usado em nav_last_seen. */
export async function subscribeToPush(userId: string): Promise<void> {
  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!vapidPublicKey) throw new Error('VITE_VAPID_PUBLIC_KEY não configurada')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Permissão de notificação negada')

  const registration = await serviceWorkerReadyWithTimeout()
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: json.endpoint as string,
      p256dh: json.keys?.p256dh as string,
      auth_key: json.keys?.auth as string,
      user_agent: navigator.userAgent,
    },
    { onConflict: 'user_id,endpoint' },
  )
  if (error) throw error
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getCurrentPushSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}
