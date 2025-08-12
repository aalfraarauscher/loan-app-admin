import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  role: 'super_admin' | 'admin' | 'viewer';
  created_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAdminUser(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAdminUser(session.user.id);
      } else {
        setAdminUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAdminUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setAdminUser(data);
    } catch (error) {
      console.error('Error fetching admin user:', error);
      // User is not an admin
      setAdminUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Check if user is admin - with retry logic for RLS
    let retries = 3;
    let adminData = null;
    let adminError = null;
    
    while (retries > 0 && !adminData) {
      const result = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      adminData = result.data;
      adminError = result.error;
      
      if (!adminData && retries > 1) {
        // Wait a bit for RLS to catch up
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      retries--;
    }

    if (adminError || !adminData) {
      console.error('Admin check failed:', adminError);
      await supabase.auth.signOut();
      throw new Error('You are not authorized to access the admin panel');
    }

    setAdminUser(adminData);
    return data;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAdminUser(null);
  };

  return {
    user,
    adminUser,
    loading,
    isAdmin: !!adminUser,
    signIn,
    signOut,
  };
};