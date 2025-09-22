import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useUserRole, UserRole } from '../hooks/useUserRole'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading: authLoading } = useAuth()
  const { userProfile, loading: roleLoading, canAccessRoute } = useUserRole()

  if (authLoading || roleLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && !canAccessRoute(requiredRole)) {
    // Redirect based on user's actual role
    if (userProfile?.role === 'student') {
      return <Navigate to="/dashboard" replace />
    } else if (userProfile?.role === 'instructor') {
      return <Navigate to="/instructor" replace />
    } else {
      return <Navigate to="/admin/users" replace />
    }
  }

  return <>{children}</>
}
