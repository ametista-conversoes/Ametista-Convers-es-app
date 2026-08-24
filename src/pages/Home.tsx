import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Dashboard from '@/pages/client/Dashboard'

/** "/" precisa decidir por papel: cliente vê o próprio Dashboard;
 * admin/gestor não têm client_id nenhum, então são mandados pra
 * própria home deles (/admin) em vez de caírem no aviso de "conta não
 * vinculada" do Portal Cliente. */
export default function Home() {
  const { role, loading } = useAuth()

  if (loading) return null
  if (role === 'admin' || role === 'gestor') return <Navigate to="/admin" replace />
  return <Dashboard />
}
