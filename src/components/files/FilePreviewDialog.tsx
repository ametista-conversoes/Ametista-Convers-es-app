import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { FileItemRecord } from '@/hooks/useClientPortalData'
import { getFileSignedUrl } from '@/lib/storage'

interface FilePreviewDialogProps {
  file: (FileItemRecord & { category: 'image' | 'video' }) | null
  onOpenChange: (open: boolean) => void
}

export function FilePreviewDialog({ file, onOpenChange }: FilePreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!file?.file_url) {
      setUrl(null)
      return
    }
    setLoading(true)
    setUrl(null)
    const resolve = file.file_url.startsWith('http')
      ? Promise.resolve(file.file_url)
      : getFileSignedUrl(file.file_url)

    resolve
      .then(setUrl)
      .catch(() => toast.error('Não foi possível carregar a prévia.'))
      .finally(() => setLoading(false))
  }, [file])

  return (
    <Dialog open={!!file} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        {file && (
          <>
            <DialogHeader>
              <DialogTitle>{file.name}</DialogTitle>
            </DialogHeader>
            {loading && <p className="text-sm text-muted-foreground">Carregando prévia...</p>}
            {!loading && url && file.category === 'image' && (
              <img src={url} alt={file.name} className="max-h-[70vh] w-full rounded-lg object-contain" />
            )}
            {!loading && url && file.category === 'video' && (
              // eslint-disable-next-line jsx-a11y/media-has-caption
              <video src={url} controls preload="metadata" className="max-h-[70vh] w-full rounded-lg" />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
