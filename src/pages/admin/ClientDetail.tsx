import { useState, type ChangeEvent } from 'react'
import { useParams } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckSquare,
  FolderKanban,
  ListChecks,
  Mail,
  Phone,
  Target,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { NewProjectDialog } from '@/components/admin/NewProjectDialog'
import { CassieChatThread } from '@/components/cassie/CassieChatThread'
import { CassieHeader } from '@/components/cassie/CassieHeader'
import { CassieMessageForm } from '@/components/cassie/CassieMessageForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useCassieMessages, useClearCassieHistory, useSendCassieMessage } from '@/hooks/useCassieMessages'
import {
  useActivityChecklistItems,
  useAllAlerts,
  useAllIncidents,
  useAllMeetings,
  useAllProjects,
  useAllSmartGoals,
  useAllTasks,
  useManagerClient,
  useToggleActivityChecklistItem,
  useUpdateClientDetails,
  useUpdateClientStatus,
} from '@/hooks/useManagerPortalData'
import { CASSIE_MODES, type CassieMode } from '@/lib/cassie-modes'
import { formatDate, formatDateTime, formatFullDate } from '@/lib/format'
import { getClientRiskDetails } from '@/lib/client-risk'
import { uploadClientLogo } from '@/lib/storage'
import {
  clientStatusLabels,
  clientStatusStyles,
  getHealthScoreColor,
  meetingStatusLabels,
  meetingStatusStyles,
  planLabels,
  projectStatusLabels,
  projectStatusStyles,
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
  const { data: projects } = useAllProjects()
  const { data: tasks } = useAllTasks()
  const { data: goals } = useAllSmartGoals()
  const { data: meetings } = useAllMeetings()
  const { data: alerts } = useAllAlerts()
  const { data: incidents } = useAllIncidents()
  const { data: activityItems } = useActivityChecklistItems()
  const toggleActivityItem = useToggleActivityChecklistItem()
  const updateStatus = useUpdateClientStatus()
  const updateDetails = useUpdateClientDetails()
  const { data: cassieMessages } = useCassieMessages(id ?? '')
  const sendCassieMessage = useSendCassieMessage(id ?? '')
  const clearCassieHistory = useClearCassieHistory(id ?? '')

  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [cassieMode, setCassieMode] = useState<CassieMode>(CASSIE_MODES[0])
  const [name, setName] = useState<string | null>(null)
  const [company, setCompany] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [plan, setPlan] = useState<string | null>(null)
  const [monthlyFee, setMonthlyFee] = useState<string | null>(null)
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

  const nameValue = name ?? client.name
  const companyValue = company ?? client.company ?? ''
  const emailValue = email ?? client.email ?? ''
  const planValue = plan ?? client.plan ?? ''
  const monthlyFeeValue = monthlyFee ?? (client.monthly_fee != null ? String(client.monthly_fee) : '')
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
        name: client.name,
        company: client.company,
        email: client.email,
        plan: client.plan,
        monthly_fee: client.monthly_fee,
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
        name: nameValue.trim() ? nameValue.trim() : client.name,
        company: companyValue.trim() ? companyValue.trim() : null,
        email: emailValue.trim() ? emailValue.trim() : null,
        plan: planValue.trim() ? planValue.trim() : null,
        monthly_fee: monthlyFeeValue.trim() ? Number(monthlyFeeValue) : null,
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

  const clientProjects = (projects ?? []).filter((p) => p.client_id === client.id)
  const clientTasks = (tasks ?? []).filter((t) => t.client_id === client.id)
  const clientGoals = (goals ?? []).filter((g) => g.client_id === client.id)
  const clientMeetings = (meetings ?? []).filter((m) => m.client_id === client.id)
  const clientActivityItems = (activityItems ?? []).filter((i) => i.client_id === client.id)
  const riskDetails = getClientRiskDetails(client.id, {
    incidents: incidents ?? [],
    alerts: alerts ?? [],
    tasks: tasks ?? [],
    goals: goals ?? [],
  })

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

          <div className="min-w-0 flex-1 space-y-1.5">
            <Input
              value={nameValue}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do cliente"
              className="h-9 text-base font-semibold"
            />
            <Input
              value={companyValue}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nome do negócio (ex: Loja Aurora)"
              className="h-8 text-sm text-muted-foreground"
            />
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
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="contato@empresa.com"
                  value={emailValue}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8"
                />
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
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 text-muted-foreground">Plano</span>
                <Select value={planValue} onValueChange={setPlan}>
                  <SelectTrigger className="h-8 w-40">
                    <SelectValue placeholder="Selecionar" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(planLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="shrink-0 text-muted-foreground">Mensalidade</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={monthlyFeeValue}
                  onChange={(e) => setMonthlyFee(e.target.value)}
                  className="h-8 w-32"
                />
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

      {/* Cliente em risco — só aparece se houver algum problema de verdade */}
      {riskDetails.hasProblems && (
        <Card className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 md:p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Cliente em risco
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 p-0 pt-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-lg font-semibold text-foreground">{riskDetails.overdueTasks}</p>
              <p className="text-xs text-muted-foreground">Tarefas atrasadas</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{riskDetails.overdueGoals}</p>
              <p className="text-xs text-muted-foreground">Metas não concluídas no prazo</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{riskDetails.activeAlerts}</p>
              <p className="text-xs text-muted-foreground">Alertas não resolvidos</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">{riskDetails.activeIncidents}</p>
              <p className="text-xs text-muted-foreground">Incidentes abertos</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projetos */}
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardHeader className="flex flex-row items-center justify-between gap-2 p-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderKanban className="h-4 w-4 text-purple-400" />
            Projetos
          </CardTitle>
          <NewProjectDialog clientId={client.id} />
        </CardHeader>
        <CardContent className="space-y-2 p-0 pt-4">
          {clientProjects.length === 0 && <p className="text-sm text-muted-foreground">Nenhum projeto ainda.</p>}
          {clientProjects.map((project) => (
            <div key={project.id} className="rounded-lg bg-secondary/50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">{project.title}</p>
                <Badge className={projectStatusStyles[project.status]}>
                  {projectStatusLabels[project.status] ?? project.status}
                </Badge>
              </div>
              {project.objective && <p className="mt-1 text-xs text-muted-foreground">Objetivo: {project.objective}</p>}
              {project.description && (
                <p className="mt-1 text-xs text-muted-foreground/70">{project.description}</p>
              )}
            </div>
          ))}
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
            <CardContent className="max-h-[560px] space-y-2 overflow-y-auto p-0 pt-4 pr-1">
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
            <CardContent className="max-h-[560px] space-y-3 overflow-y-auto p-0 pt-4 pr-1">
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
            <CardContent className="max-h-[560px] space-y-2 overflow-y-auto p-0 pt-4 pr-1">
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

          <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListChecks className="h-4 w-4 text-purple-400" />
                Atividades
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[560px] space-y-2 overflow-y-auto p-0 pt-4 pr-1">
              {clientActivityItems.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item.</p>}
              {clientActivityItems.map((item) => (
                <label
                  key={item.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <Checkbox
                    checked={item.completed}
                    disabled={toggleActivityItem.isPending}
                    onCheckedChange={(checked) =>
                      toggleActivityItem.mutate({ itemId: item.id, completed: checked === true })
                    }
                  />
                  <div className="min-w-0">
                    <p
                      className={`truncate text-sm ${item.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.source_template_name ?? 'Avulsa'}
                      {item.category ? ` · ${item.category}` : ''}
                    </p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cassie IA — conversa própria do gestor sobre esse cliente,
          separada da conversa que o próprio cliente tem com a Cassie.
          Admin/gestor sempre veem os 4 modos, independente do plano. */}
      <Card className="rounded-xl border border-[#1A2540] bg-[#131C31] p-5 hover:border-purple-600/30 md:p-6">
        <CardContent className="space-y-4 p-0">
          <CassieHeader
            plan={client.plan}
            allowedModes={CASSIE_MODES}
            mode={cassieMode}
            onModeChange={setCassieMode}
            onClearHistory={() => clearCassieHistory.mutate()}
            clearing={clearCassieHistory.isPending}
            hasMessages={(cassieMessages ?? []).length > 0}
          />
          <CassieChatThread messages={cassieMessages ?? []} sending={sendCassieMessage.isPending} />
          <CassieMessageForm
            onSend={(text) => sendCassieMessage.mutate({ message: text, mode: cassieMode })}
            sending={sendCassieMessage.isPending}
          />
        </CardContent>
      </Card>
    </div>
  )
}
