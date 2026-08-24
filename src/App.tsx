import type { ComponentType } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleRoute } from '@/components/auth/RoleRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { clientNavItems, managerNavItems } from '@/lib/nav-items'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ResetPassword from '@/pages/auth/ResetPassword'
import Cassie from '@/pages/client/Cassie'
import Comments from '@/pages/client/Comments'
import Files from '@/pages/client/Files'
import Meetings from '@/pages/client/Meetings'
import Performance from '@/pages/client/Performance'
import Project from '@/pages/client/Project'
import Reports from '@/pages/client/Reports'
import Tasks from '@/pages/client/Tasks'
import Home from '@/pages/Home'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import Settings from '@/pages/Settings'
import Assets from '@/pages/admin/Assets'
import Activities from '@/pages/admin/Activities'
import AudienceInsights from '@/pages/admin/AudienceInsights'
import ClientComments from '@/pages/admin/ClientComments'
import ClientDetail from '@/pages/admin/ClientDetail'
import Clients from '@/pages/admin/Clients'
import DashboardExecutivo from '@/pages/admin/DashboardExecutivo'
import Incidents from '@/pages/admin/Incidents'
import Integrations from '@/pages/admin/Integrations'
import Kanban from '@/pages/admin/Kanban'
import ManagerCassie from '@/pages/admin/ManagerCassie'
import ManagerClientTasks from '@/pages/admin/ManagerClientTasks'
import ManagerFiles from '@/pages/admin/ManagerFiles'
import ManagerMeetings from '@/pages/admin/ManagerMeetings'
import SmartGoals from '@/pages/admin/SmartGoals'
import Timeline from '@/pages/admin/Timeline'
import Workflows from '@/pages/admin/Workflows'

// Rotas do Portal Cliente que já têm página real — as demais continuam
// com a página de exemplo até as próximas sub-fases da Fase 4.
// "/settings" é compartilhada pelos 3 papéis (ver Sidebar.tsx).
const clientPagesReady: Record<string, ComponentType> = {
  '/': Home,
  '/performance': Performance,
  '/project': Project,
  '/reports': Reports,
  '/tasks': Tasks,
  '/files': Files,
  '/comments': Comments,
  '/meetings': Meetings,
  '/cassie': Cassie,
  '/settings': Settings,
}

// Rotas do Portal Gestor que já têm página real — as demais continuam
// com a página de exemplo até as próximas sub-fases da Fase 5.
const managerPagesReady: Record<string, ComponentType> = {
  '/admin': DashboardExecutivo,
  '/clients': Clients,
  '/kanban': Kanban,
  '/client-tasks': ManagerClientTasks,
  '/workflows': Workflows,
  '/incidents': Incidents,
  '/timeline': Timeline,
  '/assets': Assets,
  '/integrations': Integrations,
  '/audiences': AudienceInsights,
  '/smart-goals': SmartGoals,
  '/activities': Activities,
  '/client-comments': ClientComments,
  '/client-meetings': ManagerMeetings,
  '/client-files': ManagerFiles,
  '/client-cassie': ManagerCassie,
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {clientNavItems.map((item) => {
            const ReadyPage = clientPagesReady[item.href]
            return (
              <Route
                key={item.href}
                path={item.href}
                element={ReadyPage ? <ReadyPage /> : <PlaceholderPage title={item.title} portal="Portal Cliente" />}
              />
            )
          })}

          <Route element={<RoleRoute allowedRoles={['admin', 'gestor']} />}>
            {managerNavItems.map((item) => {
              const ReadyPage = managerPagesReady[item.href]
              return (
                <Route
                  key={item.href}
                  path={item.href}
                  element={ReadyPage ? <ReadyPage /> : <PlaceholderPage title={item.title} portal="Portal Gestor" />}
                />
              )
            })}
            {/* "/status" mostra o mesmo conteúdo de "/incidents" (sem item próprio no menu) */}
            <Route path="/status" element={<Incidents />} />
            {/* "/alerts" existia separado antes da Fase 6.5.6 (Incidentes e
                Alertas viraram uma aba só) — mantido como redirecionamento
                pra quem tiver o link antigo salvo. */}
            <Route path="/alerts" element={<Navigate to="/incidents" replace />} />
            {/* "/onboarding" virou "/activities" na Fase 6.6.2 — mesmo
                padrão de redirecionamento do "/alerts" acima. */}
            <Route path="/onboarding" element={<Navigate to="/activities" replace />} />
            {/* Central de Informações do Cliente — acessada clicando num card em "/clients" */}
            <Route path="/clients/:id" element={<ClientDetail />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
