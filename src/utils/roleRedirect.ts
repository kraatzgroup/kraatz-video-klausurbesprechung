import { supabase } from '../lib/supabase';

export const getRoleBasedRedirect = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (data && !error) {
      const role = data.role || 'student';
      if (role === 'instructor' || role === 'springer') {
        return '/instructor';
      } else if (role === 'admin') {
        return '/admin/dashboard';
      } else {
        return '/dashboard';
      }
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
  }
  
  return '/dashboard'; // Default fallback
};
