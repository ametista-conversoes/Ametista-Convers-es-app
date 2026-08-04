import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth, type UserRole } from '@/contexts/AuthContext'

interface RoleRouteProps {
  allowedRoles: UserRole[]
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { role, loading } = useAuth()

  if (loading) return null

  if (!role || !allowedRoles.includes(role)) {
    return <AccessDenied />
  }

  return <Outlet />
}

function AccessDenied() {
  useEffect(() => {
    toast.error('Acesso negado', {
      description: 'Você não tem permissão para acessar essa página.',
    })
  }, [])

  return <Navigate to="/" replace />
}
