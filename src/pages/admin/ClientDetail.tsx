import { useState, type ChangeEvent } from 'react'
import { useParams } from 'react-router-dom'
import { Building2, Calendar, CheckSquare, Mail, Phone, Target, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DatePicker } from '@/components/ui/date-picker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  useAllMeetings,
  useAllSmartGoals,
  useAllTasks,
  useManagerClient,
  useUpdateClientDetails,
  useUpdateClientStatus,
} from '@/hooks/useManagerPortalData'
import { formatCurrency, formatDate, formatDateTime, formatFullDate } from '@/lib/format'
import { uploadClientLogo } from '@/lib/storage'
import {
  clientStatusLabels,
  clientStatusStyles,
  getHealthScoreColor,
  meetingStatusLabels,
  meetingStatusStyles,
  smartGoalStatusLabels,
  smartGoalStatusStyles,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusStyles,
} from '@/lib/status-styles'
import { cn } from '@/lib/utils'

const CHANGEABLE_STATUSES = ['active', 'onboarding', 'paused', 'at_risk', 'churned']

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>()
  const { data: client, isLoading } = useManagerClient(id ?? null)
  const { data: tasks } = useAllTasks()
  const { data: goals } = useAllSmartGoals()
  const { data: meetings } = useAllMeetings()
  const updateStatus = useUpdateClientStatus()
  const updateDetails = useUpdateClientDetails()

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [phone, setPhone] = useState<string | null>(null)
  const [renewalDate, setRenewalDate] = useState<string | null>(null)
  const [notes, setNotes] = useState<string | null>(null)
  const [savingDetails, setSavingDetails] = useState(false)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>
  }

  if (!client) {
    return (
      <div className="rounded-xl border border-[#1A2540] bg-[#131C31] p-6 text-sm text-muted-foreground">
        Cliente não encontrado.
      </div>
    )
  }

  const phoneValue = phone ?? client.phone ?? ''
  const renewalDateValue = renewalDate ?? client.renewal_date ?? ''
  const notesValue = notes ?? client.internal_notes ?? ''

  async function handleLogoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !client) return
    setUploadingLogo(true)
    try {
      const url = await uploadClientLogo(file, client.id)
      await updateDetails.mutateAsync({
        id: client.id,
        phone: client.phone,
        logo_url: url,
        renewal_date: client.renewal_date,
        internal_notes: client.internal_notes,
      })
      toast.success('Logo atualizada.')
    } catch {
      toast.error('Não foi possível enviar a logo.')
    } finally {
      setUploadingLogo(false)
    }
  }

  async function handleSaveDetails() {
    if (!client) return
    setSavingDetails(true)
    try {
      await updateDetails.mutateAsync({
        id: client.id,
        phone: phoneValue.trim() ? phoneValue.trim() : null,
        logo_url: client.logo_url,
        renewal_date: renewalDateValue.trim() ? renewalDateValue : null,
        internal_notes: notesValue.trim() ? notesValue.trim() : null,
      })
      toast.success('Dados do cliente atualizados.')
    } catch {
      toast.error('Não foi possível salvar os dados.')
    } finally {
      setSavingDetails(false)
    }
  }

  const clientTasks = (tasks ?? []).filter((t) => t.client_id === client.id)
  const clientGoals = (goals ?? []).filter((g) => g.client_id === client.id)
  const clientMeetings = (meetings ?? []).filter((m) => m.client_id === client.id)

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Portal Gestor</p>
        <h1 className="text-2xl font-semibold text-foreground">Central de Informações</h1>
      </div>

      {/* Cabeçalho */}
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardContent className="flex flex-wrap items-center gap-4 p-0">
          <label className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl bg-secondary/50 text-muted-foreground hover:opacity-80">
            {client.logo_url ? (
              <img src={client.logo_url} alt={client.name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="h-6 w-6" />
            )}
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100">
              <Upload className="h-4 w-4 text-white" />
            </span>
            <input type="file" accept="image/*" className="hidden" disabled={uploadingLogo} onChange={handleLogoChange} />
          </label>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-foreground">{client.name}</h2>
            <p className="truncate text-sm text-muted-foreground">{client.company ?? 'Sem empresa'}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={updateStatus.isPending}>
              <Badge className={`cursor-pointer ${clientStatusStyles[client.status]}`}>
                {clientStatusLabels[client.status] ?? client.status}
              </Badge>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {CHANGEABLE_STATUSES.map((status) => (
                <DropdownMenuItem key={status} onSelect={() => updateStatus.mutate({ clientId: client.id, status })}>
                  {clientStatusLabels[status]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardContent>
      </Card>

      {/* Contato + dados do plano */}
      <div className="content-grid-container">
        <div className="content-grid gap-4">
          <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-0 pt-4 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate text-foreground">{client.email ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  placeholder="(00) 00000-0000"
                  value={phoneValue}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-8"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Plano</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-0 pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plano</span>
                <span className="font-medium text-foreground">{client.plan ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Mensalidade</span>
                <span className="font-medium text-foreground">{formatCurrency(client.monthly_fee)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Health Score</span>
                <span className={cn('font-medium', getHealthScoreColor(client.health_score))}>
                  {client.health_score ?? '—'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="text-base">Renovação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-0 pt-4">
              <Label className="text-xs text-muted-foreground">Data de renovação</Label>
              <DatePicker value={renewalDateValue} onChange={setRenewalDate} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Observações internas */}
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="p-0">
          <CardTitle className="text-base">Observações internas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-0 pt-4">
          <p className="text-xs text-muted-foreground">Só a agência vê isso — o cliente nunca tem acesso.</p>
          <Textarea
            placeholder="Anotações internas sobre esse cliente..."
            value={notesValue}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button onClick={handleSaveDetails} disabled={savingDetails}>
            {savingDetails ? 'Salvando...' : 'Salvar'}
          </Button>
        </CardContent>
      </Card>

      {/* Tarefas, Metas, Reuniões */}
      <div className="content-grid-container">
        <div className="content-grid gap-4">
          <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckSquare className="h-4 w-4 text-purple-400" />
                Tarefas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-0 pt-4">
              {clientTasks.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma tarefa.</p>}
              {clientTasks.map((task) => (
                <div key={task.id} className="rounded-lg bg-secondary/50 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm text-foreground">{task.title}</p>
                    <Badge className={taskStatusStyles[task.status]}>{taskStatusLabels[task.status] ?? task.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {taskPriorityLabels[task.priority] ?? task.priority}
                    {task.due_date ? ` · Prazo: ${formatDate(task.due_date)}` : ''}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-4 w-4 text-purple-400" />
                Metas SMART
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-0 pt-4">
              {clientGoals.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma meta.</p>}
              {clientGoals.map((goal) => {
                const target = goal.target_value ?? 0
                const current = goal.current_value ?? 0
                const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
                return (
                  <div key={goal.id} className="rounded-lg bg-secondary/50 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="truncate text-sm text-foreground">{goal.title}</p>
                      <Badge className={smartGoalStatusStyles[goal.status]}>
                        {smartGoalStatusLabels[goal.status] ?? goal.status}
                      </Badge>
                    </div>
                    <Progress value={percent} className="mt-1" />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {current} de {target} ({percent}%)
                      {goal.target_date ? ` · Prazo: ${formatFullDate(goal.target_date)}` : ''}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-purple-400" />
                Reuniões
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-0 pt-4">
              {clientMeetings.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma reunião.</p>}
              {clientMeetings.map((meeting) => (
                <div key={meeting.id} className="rounded-lg bg-secondary/50 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="truncate text-sm text-foreground">{meeting.title}</p>
                    <Badge className={meetingStatusStyles[meeting.status]}>
                      {meetingStatusLabels[meeting.status] ?? meeting.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDateTime(meeting.date)}</p>
                  {meeting.status === 'cancelled' && meeting.cancellation_reason && (
                    <p className="mt-1 text-xs text-muted-foreground">Motivo: {meeting.cancellation_reason}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
