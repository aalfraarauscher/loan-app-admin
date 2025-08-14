import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface User {
  id: string;
  full_name: string | null;
  phone_number: string;
  email: string | null;
  kyc_verified: boolean;
  created_at: string;
  updated_at: string;
  gender?: string;
  date_of_birth?: string;
  total_applications?: number;
  last_application_date?: string;
}

export interface UserFilters {
  search?: string;
  kyc_status?: 'all' | 'verified' | 'unverified';
  date_from?: string;
  date_to?: string;
  min_applications?: number;
  max_applications?: number;
}

export interface UserStats {
  total_users: number;
  kyc_verified_users: number;
  users_this_month: number;
  active_today: number;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats>({
    total_users: 0,
    kyc_verified_users: 0,
    users_this_month: 0,
    active_today: 0,
  });
  const [filters, setFilters] = useState<UserFilters>({
    kyc_status: 'all',
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build the query with joins to get application counts
      let query = supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          phone_number,
          email,
          kyc_verified,
          created_at,
          updated_at,
          gender,
          date_of_birth
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`full_name.ilike.${searchTerm},phone_number.ilike.${searchTerm},email.ilike.${searchTerm}`);
      }

      if (filters.kyc_status === 'verified') {
        query = query.eq('kyc_verified', true);
      } else if (filters.kyc_status === 'unverified') {
        query = query.eq('kyc_verified', false);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      const { data: usersData, error: usersError } = await query;

      if (usersError) throw usersError;

      // Get application counts for each user
      if (usersData && usersData.length > 0) {
        const userIds = usersData.map(u => u.id);
        
        const { data: applicationCounts, error: countError } = await supabase
          .from('loan_applications')
          .select('user_id, created_at')
          .in('user_id', userIds);

        if (countError) throw countError;

        // Process users with application counts
        const usersWithCounts = usersData.map(user => {
          const userApplications = applicationCounts?.filter(app => app.user_id === user.id) || [];
          const lastApp = userApplications.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];

          return {
            ...user,
            total_applications: userApplications.length,
            last_application_date: lastApp?.created_at || null
          };
        });

        // Apply application count filters
        let filteredUsers = usersWithCounts;
        if (filters.min_applications !== undefined) {
          filteredUsers = filteredUsers.filter(u => u.total_applications >= filters.min_applications!);
        }
        if (filters.max_applications !== undefined) {
          filteredUsers = filteredUsers.filter(u => u.total_applications <= filters.max_applications!);
        }

        setUsers(filteredUsers);
      } else {
        setUsers([]);
      }

      // Fetch statistics
      await fetchStats();
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Total users
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // KYC verified users
      const { count: kycCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('kyc_verified', true);

      // Users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count: monthCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Active today (users with loan applications today)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      
      const { data: todayApps } = await supabase
        .from('loan_applications')
        .select('user_id')
        .gte('created_at', startOfToday.toISOString());

      const uniqueActiveToday = new Set(todayApps?.map(app => app.user_id) || []).size;

      setStats({
        total_users: totalCount || 0,
        kyc_verified_users: kycCount || 0,
        users_this_month: monthCount || 0,
        active_today: uniqueActiveToday,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Full Name', 'Phone Number', 'Email', 'KYC Verified', 'Total Applications', 'Registration Date'];
    const rows = users.map(user => [
      user.full_name || '',
      user.phone_number,
      user.email || '',
      user.kyc_verified ? 'Yes' : 'No',
      user.total_applications || 0,
      new Date(user.created_at).toLocaleDateString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        () => {
          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters]);

  return {
    users,
    loading,
    error,
    stats,
    filters,
    setFilters,
    refreshUsers: fetchUsers,
    exportToCSV,
  };
}