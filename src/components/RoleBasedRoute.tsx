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
          
          if (data && !error) {
            setUserRole(data.role || 'student');
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          setUserRole('student');
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

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (userRole && !allowedRoles.includes(userRole)) {
    // Redirect instructors to instructor dashboard if they try to access student routes
    if (userRole === 'instructor' && allowedRoles.includes('student')) {
      return <Navigate to="/instructor" replace />;
    }
    // Redirect students to dashboard if they try to access instructor routes
    if (userRole === 'student' && allowedRoles.includes('instructor')) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
