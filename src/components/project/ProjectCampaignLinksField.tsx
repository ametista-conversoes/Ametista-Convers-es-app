import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link2, Plus, Unlink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  useAddProjectCampaignLink,
  useAllDigitalAssets,
  useDigitalAssetConnections,
  useRemoveProjectCampaignLink,
  type ProjectCampaignLink,
} from '@/hooks/useManagerPortalData'
import { listCampaigns } from '@/lib/integrations'
import { connectionProviderLabels } from '@/lib/status-styles'

interface ProjectCampaignLinksFieldProps {
  projectId: string
  clientId: string
  links: ProjectCampaignLink[]
}

/** Lista de campanhas vinculadas a um projeto (Fase 32 — um projeto
 * pode ter mais de uma campanha real, ex: Search + Performance Max
 * juntas), com botão "+ Adicionar campanha" / "Remover" por linha.
 * Grava direto em `project_campaign_links` (sem passar pelo form geral
 * do projeto) — diferente de `CampaignLinkField`, que continua
 * existindo só pra escolha do 1º vínculo em `NewProjectDialog`
 * (projeto ainda não tem id nesse momento). */
export function ProjectCampaignLinksField({ projectId, clientId, links }: ProjectCampaignLinksFieldProps) {
  const [adding, setAdding] = useState(false)
  const [pendingConnectionId, setPendingConnectionId] = useState('')
  const { data: assets } = useAllDigitalAssets()
  const { data: connections } = useDigitalAssetConnections()
  const addLink = useAddProjectCampaignLink()
  const removeLink = useRemoveProjectCampaignLink()

  const clientAssetIds = new Set((assets ?? []).filter((a) => a.client_id === clientId).map((a) => a.id))
  const availableConnections = (connections ?? []).filter(
    (c) => (c.provider === 'google_ads' || c.provider === 'meta_ads') && c.status === 'connected' && clientAssetIds.has(c.digital_asset_id),
  )

  const campaignsQuery = useQuery({
    queryKey: ['campaigns-list', pendingConnectionId],
    queryFn: () => listCampaigns(pendingConnectionId),
    enabled: !!pendingConnectionId,
  })

  const linkedCampaignKeys = new Set(links.map((l) => `${l.connection_id}:${l.external_campaign_id}`))

  function cancelAdd() {
    setAdding(false)
    setPendingConnectionId('')
  }

  return (
    <div className="space-y-2">
      {links.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma campanha vinculada.</p>}
      {links.map((link) => (
        <div
          key={link.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-sm"
        >
          <span className="flex items-center gap-2 text-foreground">
            <Link2 className="h-4 w-4 text-purple-400" />
            {link.external_campaign_name ?? link.external_campaign_id}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={removeLink.isPending}
            onClick={() => removeLink.mutate({ id: link.id, project_id: projectId })}
          >
            <Unlink className="h-3.5 w-3.5" />
            Remover
          </Button>
        </div>
      ))}

      {!adding && (
        <Button type="button" variant="outline" size="sm" onClick={() => setAdding(true)}>
          <Plus className="h-3.5 w-3.5" />
          Adicionar campanha
        </Button>
      )}

      {adding && (
        <div className="space-y-2 rounded-lg bg-secondary/30 p-3">
          <Select value={pendingConnectionId} onValueChange={setPendingConnectionId}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha a conta de anúncios" />
            </SelectTrigger>
            <SelectContent>
              {availableConnections.length === 0 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhuma conta conectada pra esse cliente.</p>
              )}
              {availableConnections.map((connection) => {
                const asset = (assets ?? []).find((a) => a.id === connection.digital_asset_id)
                return (
                  <SelectItem key={connection.id} value={connection.id}>
                    {asset?.name ?? 'Ativo digital'} — {connectionProviderLabels[connection.provider] ?? connection.provider}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>

          {pendingConnectionId && (
            <>
              {campaignsQuery.isLoading && <p className="text-xs text-muted-foreground">Buscando campanhas...</p>}
              {campaignsQuery.isError && (
                <p className="text-xs text-destructive">
                  {campaignsQuery.error instanceof Error ? campaignsQuery.error.message : 'Não foi possível buscar as campanhas.'}
                </p>
              )}
              {campaignsQuery.data && (
                <Select
                  value=""
                  onValueChange={(campaignId) => {
                    const campaign = campaignsQuery.data.find((c) => c.id === campaignId)
                    addLink.mutate(
                      {
                        project_id: projectId,
                        connection_id: pendingConnectionId,
                        external_campaign_id: campaignId,
                        external_campaign_name: campaign?.name ?? campaignId,
                      },
                      { onSuccess: cancelAdd },
                    )
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha a campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {campaignsQuery.data.filter((c) => !linkedCampaignKeys.has(`${pendingConnectionId}:${c.id}`)).length === 0 && (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        Nenhuma campanha nova encontrada nessa conta (ou já estão todas vinculadas).
                      </p>
                    )}
                    {campaignsQuery.data
                      .filter((c) => !linkedCampaignKeys.has(`${pendingConnectionId}:${c.id}`))
                      .map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          <Button type="button" variant="ghost" size="sm" disabled={addLink.isPending} onClick={cancelAdd}>
            Cancelar
          </Button>
        </div>
      )}
    </div>
  )
}
