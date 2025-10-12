import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

export const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({ 
  children, 
  allowedRoles = ['student'], 
  redirectTo = '/login' 
}) => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error('🚨 SECURITY: User not found in database:', error);
            console.error('🚨 SECURITY: Unauthorized access attempt by:', user.email);
            
            // Don't force logout here to prevent loops - let login page handle it
            setUserRole(null);
            setLoading(false);
            return;
          }
          
          if (data && data.role) {
            setUserRole(data.role);
          } else {
            console.error('🚨 SECURITY: No role data returned for authenticated user');
            setUserRole(null);
          }
        } catch (error) {
          console.error('🚨 SECURITY: Database error during user validation:', error);
          setUserRole(null);
        }
      }
      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-kraatz-primary"></div>
      </div>
    );
  }

  if (!user || !userRole) {
    return <Navigate to={redirectTo} replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Redirect instructors to instructor dashboard if they try to access student routes
    if (userRole === 'instructor' && allowedRoles.includes('student')) {
      return <Navigate to="/instructor" replace />;
    }
    // Redirect students to dashboard if they try to access instructor routes
    if (userRole === 'student' && allowedRoles.includes('instructor')) {
      return <Navigate to="/dashboard" replace />;
    }
    // Redirect instructors to instructor dashboard if they try to access student routes
    if (userRole === 'instructor' && allowedRoles.includes('student') && !allowedRoles.includes('instructor')) {
      return <Navigate to="/instructor" replace />;
    }
    // Redirect admin users to user management if they try to access student/instructor routes
    if (userRole === 'admin' && (allowedRoles.includes('student') || allowedRoles.includes('instructor'))) {
      return <Navigate to="/admin/users" replace />;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
