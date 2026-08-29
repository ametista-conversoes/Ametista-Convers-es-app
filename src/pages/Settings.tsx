import { AgencySettingsTab } from '@/components/settings/AgencySettingsTab'
import { AvailabilitySettingsTab } from '@/components/settings/AvailabilitySettingsTab'
import { ClientSettingsTab } from '@/components/settings/ClientSettingsTab'
import { ErrorLogsSettingsTab } from '@/components/settings/ErrorLogsSettingsTab'
import { GlobalSettingsTab } from '@/components/settings/GlobalSettingsTab'
import { UserSettingsTab } from '@/components/settings/UserSettingsTab'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/AuthContext'

export default function Settings() {
  const { role } = useAuth()
  const showGlobal = role === 'admin'
  const showAgency = role === 'admin' || role === 'gestor'
  const showClient = role === 'cliente'

  const defaultTab = showGlobal ? 'global' : showAgency ? 'agency' : 'client'

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portal</p>
        <h1 className="text-2xl font-semibold text-foreground">Configurações</h1>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          {showGlobal && <TabsTrigger value="global">Globais</TabsTrigger>}
          {showAgency && <TabsTrigger value="agency">Agência</TabsTrigger>}
          {showAgency && <TabsTrigger value="availability">Disponibilidade</TabsTrigger>}
          {showAgency && <TabsTrigger value="errors">Erros</TabsTrigger>}
          {showClient && <TabsTrigger value="client">Cliente</TabsTrigger>}
          <TabsTrigger value="user">Usuário</TabsTrigger>
        </TabsList>

        {showGlobal && (
          <TabsContent value="global">
            <GlobalSettingsTab />
          </TabsContent>
        )}

        {showAgency && (
          <TabsContent value="agency">
            <AgencySettingsTab canEdit={role === 'admin'} />
          </TabsContent>
        )}

        {showAgency && (
          <TabsContent value="availability">
            <AvailabilitySettingsTab />
          </TabsContent>
        )}

        {showAgency && (
          <TabsContent value="errors">
            <ErrorLogsSettingsTab />
          </TabsContent>
        )}

        {showClient && (
          <TabsContent value="client">
            <ClientSettingsTab />
          </TabsContent>
        )}

        <TabsContent value="user">
          <UserSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
