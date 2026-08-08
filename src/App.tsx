import type { ComponentType } from 'react'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleRoute } from '@/components/auth/RoleRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { clientNavItems, managerNavItems } from '@/lib/nav-items'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ResetPassword from '@/pages/auth/ResetPassword'
import Comments from '@/pages/client/Comments'
import Dashboard from '@/pages/client/Dashboard'
import Files from '@/pages/client/Files'
import Meetings from '@/pages/client/Meetings'
import Performance from '@/pages/client/Performance'
import Project from '@/pages/client/Project'
import Reports from '@/pages/client/Reports'
import Tasks from '@/pages/client/Tasks'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import Settings from '@/pages/Settings'
import Alerts from '@/pages/admin/Alerts'
import Assets from '@/pages/admin/Assets'
import ClientComments from '@/pages/admin/ClientComments'
import ClientDetail from '@/pages/admin/ClientDetail'
import Clients from '@/pages/admin/Clients'
import DashboardExecutivo from '@/pages/admin/DashboardExecutivo'
import Incidents from '@/pages/admin/Incidents'
import Kanban from '@/pages/admin/Kanban'
import ManagerFiles from '@/pages/admin/ManagerFiles'
import ManagerMeetings from '@/pages/admin/ManagerMeetings'
import Onboarding from '@/pages/admin/Onboarding'
import SmartGoals from '@/pages/admin/SmartGoals'
import Timeline from '@/pages/admin/Timeline'
import Workflows from '@/pages/admin/Workflows'

// Rotas do Portal Cliente que já têm página real — as demais continuam
// com a página de exemplo até as próximas sub-fases da Fase 4.
// "/settings" é compartilhada pelos 3 papéis (ver Sidebar.tsx).
const clientPagesReady: Record<string, ComponentType> = {
  '/': Dashboard,
  '/performance': Performance,
  '/project': Project,
  '/reports': Reports,
  '/tasks': Tasks,
  '/files': Files,
  '/comments': Comments,
  '/meetings': Meetings,
  '/settings': Settings,
}

// Rotas do Portal Gestor que já têm página real — as demais continuam
// com a página de exemplo até as próximas sub-fases da Fase 5.
const managerPagesReady: Record<string, ComponentType> = {
  '/admin': DashboardExecutivo,
  '/clients': Clients,
  '/kanban': Kanban,
  '/workflows': Workflows,
  '/incidents': Incidents,
  '/alerts': Alerts,
  '/timeline': Timeline,
  '/assets': Assets,
  '/smart-goals': SmartGoals,
  '/onboarding': Onboarding,
  '/client-comments': ClientComments,
  '/client-meetings': ManagerMeetings,
  '/client-files': ManagerFiles,
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
            {/* Central de Informações do Cliente — acessada clicando num card em "/clients" */}
            <Route path="/clients/:id" element={<ClientDetail />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
