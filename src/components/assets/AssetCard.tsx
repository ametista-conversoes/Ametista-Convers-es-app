import { Boxes, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ManagerDigitalAssetRecord } from '@/hooks/useManagerPortalData'
import { useUpdateDigitalAssetStatus } from '@/hooks/useManagerPortalData'
import { digitalAssetStatusLabels, digitalAssetStatusStyles, digitalAssetTypeLabels } from '@/lib/status-styles'

interface AssetCardProps {
  asset: ManagerDigitalAssetRecord
}

const CHANGEABLE_STATUSES = ['active', 'inactive', 'pending', 'revoked']

export function AssetCard({ asset }: AssetCardProps) {
  const updateStatus = useUpdateDigitalAssetStatus()

  return (
    <Card className="flex flex-col rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
      <CardHeader className="p-0">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex min-w-0 items-center gap-2">
            <Boxes className="h-4 w-4 shrink-0 text-purple-400" />
            <span className="truncate">{asset.name}</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 p-0 pt-4">
        <p className="text-sm text-muted-foreground">
          {asset.type ? (digitalAssetTypeLabels[asset.type] ?? asset.type) : 'Tipo não informado'}
          {asset.platform ? ` · ${asset.platform}` : ''}
        </p>
        <p className="text-xs text-muted-foreground/70">{asset.client?.name ?? 'Cliente'}</p>

        {asset.url && (
          <a
            href={asset.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-sm text-purple-400 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{asset.url}</span>
          </a>
        )}

        {asset.code && (
          <code className="block max-h-24 overflow-y-auto rounded-md bg-secondary/50 p-2 text-xs text-muted-foreground">
            {asset.code}
          </code>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={updateStatus.isPending}>
              <Badge className={`cursor-pointer ${digitalAssetStatusStyles[asset.status]}`}>
                {digitalAssetStatusLabels[asset.status] ?? asset.status}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {CHANGEABLE_STATUSES.map((status) => (
                <DropdownMenuItem
                  key={status}
                  onSelect={() => updateStatus.mutate({ assetId: asset.id, status })}
                >
                  {digitalAssetStatusLabels[status]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}
