import { Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function CommentGuidelines() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Info className="h-4 w-4" />
          Regras de uso
        </Button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-80 text-sm">
        <p className="mb-2 font-medium text-foreground">Como usar os comentários</p>
        <ul className="list-disc space-y-2 pl-4 text-xs text-muted-foreground">
          <li>Use este espaço só para assuntos sérios ou dúvidas sobre algo que já está em andamento.</li>
          <li>Toda mensagem é respondida em até 24 horas.</li>
          <li>
            Inclua sempre o tópico entre colchetes no título. Exemplo:{' '}
            <span className="text-foreground">"Dúvida sobre o criativo [anuncio]"</span>.
          </li>
        </ul>
      </PopoverContent>
    </Popover>
  )
}
