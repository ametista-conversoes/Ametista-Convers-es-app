import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleRoute } from '@/components/auth/RoleRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { clientNavItems, managerNavItems } from '@/lib/nav-items'
import ForgotPassword from '@/pages/auth/ForgotPassword'
import Login from '@/pages/auth/Login'
import Register from '@/pages/auth/Register'
import ResetPassword from '@/pages/auth/ResetPassword'
import { PlaceholderPage } from '@/pages/PlaceholderPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {clientNavItems.map((item) => (
            <Route
              key={item.href}
              path={item.href}
              element={<PlaceholderPage title={item.title} portal="Portal Cliente" />}
            />
          ))}

          <Route element={<RoleRoute allowedRoles={['admin', 'gestor']} />}>
            {managerNavItems.map((item) => (
              <Route
                key={item.href}
                path={item.href}
                element={<PlaceholderPage title={item.title} portal="Portal Gestor" />}
              />
            ))}
          </Route>
        </Route>
      </Route>
    </Routes>
  )
}

export default App
