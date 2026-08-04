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
import { useAuth } from '@/contexts/AuthContext'
import { useCreateFileItem } from '@/hooks/useClientPortalData'
import { uploadClientFile } from '@/lib/storage'

export function NewFileDialog() {
  const { clientId } = useAuth()
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [folder, setFolder] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const createFileItem = useCreateFileItem()

  async function handleSubmit() {
    if (!file || !clientId) return
    setSubmitting(true)
    try {
      const path = await uploadClientFile(file, clientId)
      await createFileItem.mutateAsync({
        name: file.name,
        folder: folder.trim() ? folder.trim() : null,
        file_url: path,
        file_type: file.type || null,
      })
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
          Novo arquivo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo arquivo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-input">Arquivo</Label>
            <Input id="file-input" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="folder-input">Pasta (opcional)</Label>
            <Input
              id="folder-input"
              placeholder="Ex: Criativos, Contratos"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!file || submitting}>
            {submitting ? 'Enviando...' : 'Enviar arquivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
