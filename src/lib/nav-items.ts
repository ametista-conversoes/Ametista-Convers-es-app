import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  Calendar,
  CheckSquare,
  Columns3,
  FileText,
  FolderKanban,
  History,
  LayoutDashboard,
  ListChecks,
  MessageSquare,
  Plug,
  Settings,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

export const clientNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Performance', href: '/performance', icon: TrendingUp },
  { title: 'Projeto', href: '/project', icon: FolderKanban },
  { title: 'Tarefas', href: '/tasks', icon: CheckSquare },
  { title: 'Arquivos', href: '/files', icon: FileText },
  { title: 'Comentários', href: '/comments', icon: MessageSquare },
  { title: 'Reuniões', href: '/meetings', icon: Calendar },
  { title: 'Cassie IA', href: '/cassie', icon: Sparkles },
  { title: 'Relatórios', href: '/reports', icon: BarChart3 },
  { title: 'Configurações', href: '/settings', icon: Settings },
]

export const managerNavItems: NavItem[] = [
  { title: 'Dashboard Executivo', href: '/admin', icon: LayoutDashboard },
  { title: 'Clientes', href: '/clients', icon: Users },
  { title: 'Kanban', href: '/kanban', icon: Columns3 },
  { title: 'Workflows', href: '/workflows', icon: Workflow },
  { title: 'Incidentes', href: '/incidents', icon: AlertTriangle },
  { title: 'Ativos Digitais', href: '/assets', icon: Boxes },
  { title: 'Integrações', href: '/integrations', icon: Plug },
  { title: 'Alertas', href: '/alerts', icon: Bell },
  { title: 'Timeline', href: '/timeline', icon: History },
  { title: 'Metas SMART', href: '/smart-goals', icon: Target },
  { title: 'Onboarding', href: '/onboarding', icon: ListChecks },
  { title: 'Comentários', href: '/client-comments', icon: MessageSquare },
  { title: 'Reuniões', href: '/client-meetings', icon: Calendar },
  { title: 'Arquivos', href: '/client-files', icon: FileText },
]
