interface UnlinkedClientNoticeProps {
  /** Encaixa na frase: "não há {page} para mostrar" — ex: "Tarefas", "Relatórios". */
  page: string
}

export function UnlinkedClientNotice({ page }: UnlinkedClientNoticeProps) {
  return (
    <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
      Esta conta ainda não está vinculada a nenhum cliente, então não há {page} para mostrar. Entre em contato com o
      administrador da agência para que ele vincule sua conta a um cliente e defina o plano.
    </div>
  )
}
