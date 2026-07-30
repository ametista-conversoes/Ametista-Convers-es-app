import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { PlaceholderPage } from '@/pages/PlaceholderPage'
import { clientNavItems, managerNavItems } from '@/lib/nav-items'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {clientNavItems.map((item) => (
          <Route
            key={item.href}
            path={item.href}
            element={<PlaceholderPage title={item.title} portal="Portal Cliente" />}
          />
        ))}
        {managerNavItems.map((item) => (
          <Route
            key={item.href}
            path={item.href}
            element={<PlaceholderPage title={item.title} portal="Portal Gestor" />}
          />
        ))}
      </Route>
    </Routes>
  )
}

export default App
