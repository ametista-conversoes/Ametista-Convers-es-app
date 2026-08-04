import { supabase } from '@/lib/supabase'

const BUCKET = 'client-files'

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
