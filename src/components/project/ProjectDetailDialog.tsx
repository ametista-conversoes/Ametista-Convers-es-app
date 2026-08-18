import { useEffect } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { TaskList } from '@/components/tasks/TaskList'
import type { ManagerProjectRecord, ManagerTaskRecord } from '@/hooks/useManagerPortalData'
import { useUpdateProject } from '@/hooks/useManagerPortalData'
import { formatCurrency, formatDate, formatMultiplier, formatPercent } from '@/lib/format'
import { segmentationOptionGroups } from '@/lib/segmentation-options'
import { projectStatusLabels, projectStatusStyles } from '@/lib/status-styles'
import { useForm } from 'react-hook-form'

interface ProjectDetailDialogProps {
  project: ManagerProjectRecord | null
  tasks: ManagerTaskRecord[]
  onOpenChange: (open: boolean) => void
}

interface CampaignFormValues {
  icp: string
  segmentations: string[]
  objective: string
  systems: string
  description: string
}

export function ProjectDetailDialog({ project, tasks, onOpenChange }: ProjectDetailDialogProps) {
  const updateProject = useUpdateProject()

  const form = useForm<CampaignFormValues>({
    defaultValues: { icp: '', segmentations: [], objective: '', systems: '', description: '' },
  })

  useEffect(() => {
    if (!project) return
    form.reset({
      icp: project.icp ?? '',
      segmentations: project.segmentations,
      objective: project.objective ?? '',
      systems: project.systems ?? '',
      description: project.description ?? '',
    })
  }, [project, form])

  async function onSubmit(values: CampaignFormValues) {
    if (!project) return
    try {
      await updateProject.mutateAsync({
        id: project.id,
        icp: values.icp.trim() ? values.icp.trim() : null,
        segmentations: values.segmentations,
        objective: values.objective.trim() ? values.objective.trim() : null,
        systems: values.systems.trim() ? values.systems.trim() : null,
        description: values.description.trim() ? values.description.trim() : null,
      })
      toast.success('Campanha atualizada.')
    } catch {
      toast.error('Não foi possível salvar a campanha.')
    }
  }

  const segmentations = form.watch('segmentations')

  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        {project && (
          <>
            <DialogHeader>
              <DialogTitle>{project.title}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="overview">
              <TabsList>
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="tasks">Tarefas</TabsTrigger>
                <TabsTrigger value="campaign">Campanha</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={projectStatusStyles[project.status]}>
                    {projectStatusLabels[project.status] ?? project.status}
                  </Badge>
                  {project.channel && (
                    <Badge className="border-[#1A2540] bg-secondary/50 text-muted-foreground">{project.channel}</Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
                  <div>
                    <p className="text-xs text-muted-foreground">CPA</p>
                    <p className="text-foreground">{formatCurrency(project.cpa)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ROAS</p>
                    <p className="text-foreground">{formatMultiplier(project.roas)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className="text-foreground">{formatPercent(project.ctr)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Gasto</p>
                    <p className="text-foreground">{formatCurrency(project.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Receita</p>
                    <p className="text-foreground">{formatCurrency(project.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Período</p>
                    <p className="text-foreground">
                      {formatDate(project.start_date)} — {project.end_date ? formatDate(project.end_date) : 'sem data final'}
                    </p>
                  </div>
                </div>

                {project.objective && (
                  <div>
                    <p className="text-xs text-muted-foreground">Objetivo</p>
                    <p className="text-sm text-foreground">{project.objective}</p>
                  </div>
                )}
                {project.description && (
                  <div>
                    <p className="text-xs text-muted-foreground">Outras informações</p>
                    <p className="text-sm text-foreground">{project.description}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tasks">
                <TaskList tasks={tasks} title="Tarefas do projeto" />
              </TabsContent>

              <TabsContent value="campaign" className="space-y-4">
                <div>
                  <label className="text-sm text-foreground">Público-alvo</label>
                  <Textarea
                    placeholder="Quem essa campanha busca atingir..."
                    {...form.register('icp')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <p className="text-sm text-foreground">Segmentações</p>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Referência de categorias comuns do Meta Ads e do Google Ads, pra padronizar como a segmentação é documentada.
                  </p>
                  <div className="max-h-52 space-y-3 overflow-y-auto rounded-lg bg-secondary/30 p-3">
                    {segmentationOptionGroups.map((group) => (
                      <div key={group.platform}>
                        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {group.platform}
                        </p>
                        <div className="space-y-1.5">
                          {group.options.map((option) => (
                            <label key={option} className="flex items-center gap-2 text-sm">
                              <Checkbox
                                checked={segmentations.includes(option)}
                                onCheckedChange={(checked) =>
                                  form.setValue(
                                    'segmentations',
                                    checked === true
                                      ? [...segmentations, option]
                                      : segmentations.filter((s) => s !== option),
                                    { shouldDirty: true },
                                  )
                                }
                              />
                              <span className="text-foreground">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm text-foreground">Objetivo</label>
                  <Textarea placeholder="Objetivo da campanha..." {...form.register('objective')} className="mt-1" />
                </div>

                <div>
                  <label className="text-sm text-foreground">Sistemas</label>
                  <Textarea
                    placeholder="Ex: HubSpot, RD Station, Google Analytics, WordPress..."
                    {...form.register('systems')}
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="text-sm text-foreground">Outras informações</label>
                  <Textarea
                    placeholder="Detalhes adicionais relevantes pra essa campanha..."
                    {...form.register('description')}
                    className="mt-1"
                  />
                </div>

                <Button onClick={form.handleSubmit(onSubmit)} disabled={updateProject.isPending}>
                  {updateProject.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
