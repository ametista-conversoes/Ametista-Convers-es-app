import { useState } from 'react'
import { ManagerApprovalList } from '@/components/files/ManagerApprovalList'
import { ManagerFileList } from '@/components/files/ManagerFileList'
import { NewManagerApprovalDialog } from '@/components/files/NewManagerApprovalDialog'
import { NewManagerFileDialog } from '@/components/files/NewManagerFileDialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAllClients, useClientApprovals, useClientFileItems } from '@/hooks/useManagerPortalData'

export default function ManagerFiles() {
  const { data: clients } = useAllClients()
  const [clientId, setClientId] = useState<string>('')
  const { data: files, isLoading: loadingFiles } = useClientFileItems(clientId || null)
  const { data: approvals, isLoading: loadingApprovals } = useClientApprovals(clientId || null)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Portal Gestor</p>
          <h1 className="text-2xl font-semibold text-foreground">Arquivos</h1>
        </div>
        <Select value={clientId} onValueChange={setClientId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Selecione um cliente" />
          </SelectTrigger>
          <SelectContent>
            {(clients ?? []).map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!clientId && (
        <p className="text-sm text-muted-foreground">Escolha um cliente acima para ver e enviar arquivos.</p>
      )}

      {clientId && (
        <Tabs defaultValue="files">
          <TabsList>
            <TabsTrigger value="files">Arquivos</TabsTrigger>
            <TabsTrigger value="approvals">Aprovações</TabsTrigger>
          </TabsList>

          <TabsContent value="files" className="space-y-3">
            <div className="flex justify-end">
              <NewManagerFileDialog clientId={clientId} />
            </div>
            {loadingFiles ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <ManagerFileList files={files ?? []} />
            )}
          </TabsContent>

          <TabsContent value="approvals" className="space-y-3">
            <div className="flex justify-end">
              <NewManagerApprovalDialog clientId={clientId} />
            </div>
            {loadingApprovals ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <ManagerApprovalList approvals={approvals ?? []} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
