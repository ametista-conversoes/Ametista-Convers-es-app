import { useState } from 'react'
import { FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeleteItemButton } from '@/components/shared/DeleteItemButton'
import type { FileItemRecord } from '@/hooks/useClientPortalData'
import { useDeleteFile } from '@/hooks/useClientPortalData'
import { getFileSignedUrl } from '@/lib/storage'
import { formatDateTime } from '@/lib/format'
import { fileCategoryLabels, getFileCategory, type FileCategory } from '@/lib/file-category'
import { FilePreviewDialog } from './FilePreviewDialog'

interface FileListProps {
  files: FileItemRecord[]
  deleteMode?: boolean
}

const CATEGORY_ORDER: FileCategory[] = ['image', 'video', 'audio', 'document', 'other']

export function FileList({ files, deleteMode }: FileListProps) {
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<(FileItemRecord & { category: 'image' | 'video' }) | null>(null)
  const deleteFile = useDeleteFile()

  async function handleOpen(file: FileItemRecord) {
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

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    files: files.filter((file) => getFileCategory(file.file_type) === category),
  })).filter((group) => group.files.length > 0)

  return (
    <>
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-purple-400" />
            Arquivos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 p-0 pt-4">
          {files.length === 0 && <p className="text-sm text-muted-foreground">Nenhum arquivo enviado ainda.</p>}
          {groups.map((group) => (
            <div key={group.category} className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                {fileCategoryLabels[group.category]}
              </h3>
              <div className="space-y-2">
                {group.files.map((file) => {
                  const canPreview = group.category === 'image' || group.category === 'video'
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.folder ?? 'Sem pasta'} · {formatDateTime(file.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={openingId === file.id}
                          onClick={() =>
                            canPreview
                              ? setPreviewFile({ ...file, category: group.category as 'image' | 'video' })
                              : handleOpen(file)
                          }
                        >
                          {openingId === file.id ? 'Abrindo...' : canPreview ? 'Ver' : 'Abrir'}
                        </Button>
                        {deleteMode && (
                          <DeleteItemButton
                            label={`o arquivo "${file.name}"`}
                            onDelete={() => deleteFile.mutateAsync(file.id)}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <FilePreviewDialog file={previewFile} onOpenChange={(open) => !open && setPreviewFile(null)} />
    </>
  )
}
