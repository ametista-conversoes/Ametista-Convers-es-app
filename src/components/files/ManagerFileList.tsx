import { useState } from 'react'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ManagerFileItemRecord } from '@/hooks/useManagerPortalData'
import { formatDateTime } from '@/lib/format'
import { getFileSignedUrl } from '@/lib/storage'

interface ManagerFileListProps {
  files: ManagerFileItemRecord[]
}

export function ManagerFileList({ files }: ManagerFileListProps) {
  const [openingId, setOpeningId] = useState<string | null>(null)

  async function handleOpen(file: ManagerFileItemRecord) {
    if (!file.file_url) return
    setOpeningId(file.id)
    try {
      const url = file.file_url.startsWith('http') ? file.file_url : await getFileSignedUrl(file.file_url)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch {
      toast.error('Não foi possível abrir o arquivo.')
    } finally {
      setOpeningId(null)
    }
  }

  return (
    <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-purple-400" />
          Arquivos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-0 pt-4">
        {files.length === 0 && <p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda.</p>}
        {files.map((file) => (
          <div key={file.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {file.folder ?? 'Sem pasta'} · {formatDateTime(file.created_at)}
              </p>
            </div>
            <Button variant="secondary" size="sm" disabled={openingId === file.id} onClick={() => handleOpen(file)}>
              {openingId === file.id ? 'Abrindo...' : 'Abrir'}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
