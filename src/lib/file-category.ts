export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'other'

export const fileCategoryLabels: Record<FileCategory, string> = {
  image: 'Imagens',
  video: 'Vídeos',
  audio: 'Áudios',
  document: 'Documentos',
  other: 'Outros',
}

/** Categoriza um arquivo pelo MIME type salvo em `file_type`. */
export function getFileCategory(fileType: string | null): FileCategory {
  if (!fileType) return 'other'
  if (fileType.startsWith('image/')) return 'image'
  if (fileType.startsWith('video/')) return 'video'
  if (fileType.startsWith('audio/')) return 'audio'
  if (
    fileType === 'application/pdf' ||
    fileType.startsWith('text/') ||
    fileType.includes('word') ||
    fileType.includes('excel') ||
    fileType.includes('spreadsheet') ||
    fileType.includes('presentation')
  ) {
    return 'document'
  }
  return 'other'
}
