import { supabase } from '@/lib/supabase'

const BUCKET = 'client-files'
const LOGO_BUCKET = 'client-logos'
const AVATAR_BUCKET = 'user-avatars'

/** Sobe um arquivo para a pasta do cliente no bucket privado e devolve o caminho salvo. */
export async function uploadClientFile(file: File, clientId: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${clientId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file)
  if (error) throw error

  return path
}

/** Gera um link temporário (1 hora) para abrir/baixar um arquivo já enviado. */
export async function getFileSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60)
  if (error) throw error
  return data.signedUrl
}

/** Sobe a logo de um cliente pro bucket público de logos e devolve a
 * URL pública (fica salva direto em `clients.logo_url`, sem precisar
 * gerar link assinado toda vez que for exibida). */
export async function uploadClientLogo(file: File, clientId: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${clientId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Sobe a foto de perfil do usuário logado pro bucket público de
 * avatares e devolve a URL pública (fica salva em `profiles.avatar_url`
 * via `update_own_profile`). Caminho começa com o id do próprio
 * usuário — é o que a política de storage usa pra restringir cada um a
 * mexer só no próprio avatar. */
export async function uploadUserAvatar(file: File, userId: string): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const path = `${userId}/${Date.now()}-${safeName}`

  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, file, { upsert: true })
  if (error) throw error

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)
  return data.publicUrl
}
