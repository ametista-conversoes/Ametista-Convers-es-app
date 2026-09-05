import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './KanbanCard'
import type { ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  id: string
  title: string
  tasks: ManagerTaskRecord[]
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (taskId: string) => void
}

export function KanbanColumn({ id, title, tasks, selectMode, selectedIds, onToggleSelect }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-[65vh] w-72 shrink-0 flex-col gap-3 rounded-xl border border-[#1A2540] bg-[#0B1220] p-3',
        isOver && 'border-purple-600/50 bg-purple-600/5',
      )}
    >
      <div className="flex shrink-0 items-center justify-between px-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {tasks.length === 0 && (
          <p className="rounded-lg border border-dashed border-[#1A2540] p-3 text-center text-xs text-muted-foreground">
            Nenhuma tarefa
          </p>
        )}
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            selectMode={selectMode}
            selected={selectedIds?.has(task.id)}
            onToggleSelect={() => onToggleSelect?.(task.id)}
          />
        ))}
      </div>
    </div>
  )
}
