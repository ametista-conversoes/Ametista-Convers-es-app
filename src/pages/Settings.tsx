import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AgencyProviderConnectionsCard } from '@/components/settings/AgencyProviderConnectionsCard'
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

  const [searchParams, setSearchParams] = useSearchParams()

  // Volta do /callback da Edge Function "integrations" depois de
  // conectar a conta administradora (Fase 28) — mesmo padrão de
  // Assets.tsx (leitura da query string, sem página própria porque
  // rotas sem autenticação do Supabase forçam Content-Type texto puro).
  useEffect(() => {
    const integration = searchParams.get('integration')
    if (!integration) return
    const message = searchParams.get('message')
    if (integration === 'connected') {
      toast.success(message ?? 'Conta administradora conectada com sucesso.')
    } else if (integration === 'error') {
      toast.error(message ?? 'Não foi possível conectar a conta administradora.')
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('integration')
        next.delete('message')
        return next
      },
      { replace: true },
    )
  }, [searchParams, setSearchParams])

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
          <TabsContent value="agency" className="space-y-4">
            <AgencySettingsTab canEdit={role === 'admin'} />
            <AgencyProviderConnectionsCard canEdit={role === 'admin'} />
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
