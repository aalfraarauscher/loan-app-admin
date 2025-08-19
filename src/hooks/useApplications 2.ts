import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface LoanApplication {
  id: string;
  user_id: string;
  amount: number;
  purpose: string;
  term_months: number;
  interest_rate: number;
  monthly_payment: number;
  status: 'pending' | 'approved' | 'rejected' | 'disbursed';
  employment_status?: string;
  monthly_income?: number;
  loan_purpose_details?: string;
  phone_number?: string;
  duration_months?: number;
  webhook_sent?: boolean;
  webhook_sent_at?: string;
  webhook_response?: any;
  created_at: string;
  updated_at: string;
  profiles?: {
    id: string;
    full_name?: string;
    phone_number: string;
    email?: string;
    gender?: string;
    date_of_birth?: string;
    kyc_verified?: boolean;
  };
}

interface UseApplicationsOptions {
  status?: string;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  pageSize?: number;
  page?: number;
}

export function useApplications(options: UseApplicationsOptions = {}) {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const {
    status,
    searchTerm,
    sortBy = 'created_at',
    sortOrder = 'desc',
    pageSize = 10,
    page = 1
  } = options;

  useEffect(() => {
    fetchApplications();
  }, [status, searchTerm, sortBy, sortOrder, page, pageSize]);

  const fetchApplications = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('loan_applications')
        .select(`
          *,
          profiles!user_id (
            id,
            full_name,
            phone_number,
            email,
            gender,
            date_of_birth,
            kyc_verified
          )
        `, { count: 'exact' });

      // Apply filters
      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (searchTerm) {
        // Search in application ID or user's full name
        query = query.or(`id.ilike.%${searchTerm}%,profiles.full_name.ilike.%${searchTerm}%`);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setApplications(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (
    applicationId: string, 
    newStatus: LoanApplication['status']
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (updateError) throw updateError;

      // Refresh applications
      await fetchApplications();

      return { success: true };
    } catch (err: any) {
      console.error('Error updating application status:', err);
      return { success: false, error: err.message };
    }
  };

  const triggerWebhook = async (applicationId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-loan-webhook', {
        body: { applicationId }
      });

      if (error) throw error;

      // Refresh to show webhook status
      await fetchApplications();

      return { success: true, data };
    } catch (err: any) {
      console.error('Error triggering webhook:', err);
      return { success: false, error: err.message };
    }
  };

  const getStatusCounts = async () => {
    try {
      const statuses: LoanApplication['status'][] = ['pending', 'approved', 'rejected', 'disbursed'];
      const counts: Record<string, number> = {};

      for (const status of statuses) {
        const { count } = await supabase
          .from('loan_applications')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);
        
        counts[status] = count || 0;
      }

      // Get total
      const { count: total } = await supabase
        .from('loan_applications')
        .select('*', { count: 'exact', head: true });
      
      counts.total = total || 0;

      return counts;
    } catch (err: any) {
      console.error('Error fetching status counts:', err);
      return null;
    }
  };

  const deleteApplication = async (applicationId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('loan_applications')
        .delete()
        .eq('id', applicationId);

      if (deleteError) throw deleteError;

      // Refresh applications
      await fetchApplications();

      return { success: true };
    } catch (err: any) {
      console.error('Error deleting application:', err);
      return { success: false, error: err.message };
    }
  };

  return {
    applications,
    loading,
    error,
    totalCount,
    updateApplicationStatus,
    triggerWebhook,
    getStatusCounts,
    deleteApplication,
    refetch: fetchApplications
  };
}