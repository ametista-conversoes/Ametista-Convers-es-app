import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateManagerFileItem } from '@/hooks/useManagerPortalData'
import { uploadClientFile } from '@/lib/storage'

interface NewManagerFileDialogProps {
  clientId: string
}

/** Manda um arquivo direto pra aba Arquivos do cliente, sem passar por
 * aprovação — pra quando o gestor já tem certeza que pode ir. */
export function NewManagerFileDialog({ clientId }: NewManagerFileDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [folder, setFolder] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const createFileItem = useCreateManagerFileItem()

  async function handleSubmit() {
    if (!file) return
    setSubmitting(true)
    try {
      const path = await uploadClientFile(file, clientId)
      await createFileItem.mutateAsync({
        name: file.name,
        client_id: clientId,
        folder: folder.trim() ? folder.trim() : null,
        file_url: path,
        file_type: file.type || null,
      })
      toast.success('Arquivo enviado.')
      setFile(null)
      setFolder('')
      setOpen(false)
    } catch {
      toast.error('Não foi possível enviar o arquivo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Enviar arquivo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enviar arquivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manager-file-input">Arquivo</Label>
            <Input id="manager-file-input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manager-folder-input">Pasta (opcional)</Label>
            <Input
              id="manager-folder-input"
              placeholder="Ex: Criativos, Contratos"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!file || submitting}>
            {submitting ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
