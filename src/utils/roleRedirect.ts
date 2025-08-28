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
      return role === 'instructor' ? '/instructor' : '/dashboard';
    }
  } catch (error) {
    console.error('Error fetching user role:', error);
  }
  
  return '/dashboard'; // Default fallback
};
