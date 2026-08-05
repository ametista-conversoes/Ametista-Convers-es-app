import { ApprovalList } from '@/components/files/ApprovalList'
import { FileList } from '@/components/files/FileList'
import { NewFileDialog } from '@/components/files/NewFileDialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'
import { useApprovals, useFileItems } from '@/hooks/useClientPortalData'

export default function Files() {
  const { clientId } = useAuth()
  const { data: files, isLoading: loadingFiles } = useFileItems()
  const { data: approvals, isLoading: loadingApprovals } = useApprovals()

  if (!clientId) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Esta conta não está vinculada a nenhum cliente, então não há Arquivos para mostrar.
      </div>
    )
  }

  if (loadingFiles || loadingApprovals) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Cliente</p>
          <h1 className="text-2xl font-semibold text-foreground">Arquivos</h1>
        </div>
        <NewFileDialog />
      </div>

      <Tabs defaultValue="files">
        <TabsList>
          <TabsTrigger value="files">Arquivos</TabsTrigger>
          <TabsTrigger value="approvals">Aprovações</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Repertório organizado com a agência — sem pendência de decisão.
          </p>
          <FileList files={files ?? []} />
        </TabsContent>

        <TabsContent value="approvals" className="space-y-3">
          <p className="text-xs text-muted-foreground">Itens enviados pela agência que precisam da sua decisão.</p>
          <ApprovalList approvals={approvals ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
