import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { ManagerIncidentRecord } from '@/hooks/useManagerPortalData'
import { useResolveIncident } from '@/hooks/useManagerPortalData'

interface ResolveIncidentDialogProps {
  incident: ManagerIncidentRecord | null
  onOpenChange: (open: boolean) => void
}

export function ResolveIncidentDialog({ incident, onOpenChange }: ResolveIncidentDialogProps) {
  const [resolution, setResolution] = useState('')
  const resolveIncident = useResolveIncident()

  function handleOpenChange(next: boolean) {
    if (!next) setResolution('')
    onOpenChange(next)
  }

  async function handleConfirm() {
    if (!incident) return
    try {
      await resolveIncident.mutateAsync({ incidentId: incident.id, resolution })
      handleOpenChange(false)
    } catch {
      toast.error('Não foi possível resolver o incidente.')
    }
  }

  return (
    <Dialog open={!!incident} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolver incidente</DialogTitle>
          <DialogDescription>{incident?.title}</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Descreva como o incidente foi resolvido..."
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
        <DialogFooter>
          <Button disabled={!resolution.trim() || resolveIncident.isPending} onClick={handleConfirm}>
            {resolveIncident.isPending ? 'Salvando...' : 'Marcar como resolvido'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
