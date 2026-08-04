import { Pause } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function EmergencyPauseButton() {
  return (
    <Button
      variant="destructive"
      onClick={() =>
        toast.info('Pausa de emergência ainda não disponível', {
          description: 'Essa ação vai pausar as campanhas ativas em uma próxima fase do projeto.',
        })
      }
    >
      <Pause className="h-4 w-4" />
      Pausa de Emergência
    </Button>
  )
}
