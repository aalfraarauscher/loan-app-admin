import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { DocumentType } from '@/types';

export function useDocumentTypes() {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocumentTypes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('display_order', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setDocumentTypes(data || []);
    } catch (err: any) {
      console.error('Error fetching document types:', err);
      setError(err.message || 'Failed to load document types');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDocumentType = async (documentType: Omit<DocumentType, 'id' | 'created_at' | 'updated_at'>) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('document_types')
        .insert([documentType])
        .select()
        .single();

      if (error) throw error;
      setDocumentTypes(prev => [...prev, data]);
      return { data, error: null };
    } catch (err: any) {
      console.error('Error creating document type:', err);
      const errorMessage = err.message || 'Failed to create document type';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const updateDocumentType = async (id: string, updates: Partial<Omit<DocumentType, 'id' | 'created_at' | 'updated_at'>>) => {
    setError(null);
    try {
      const { data, error } = await supabase
        .from('document_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setDocumentTypes(prev => prev.map(dt => dt.id === id ? data : dt));
      return { data, error: null };
    } catch (err: any) {
      console.error('Error updating document type:', err);
      const errorMessage = err.message || 'Failed to update document type';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    }
  };

  const deleteDocumentType = async (id: string) => {
    setError(null);
    try {
      const { error } = await supabase
        .from('document_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setDocumentTypes(prev => prev.filter(dt => dt.id !== id));
      return { error: null };
    } catch (err: any) {
      console.error('Error deleting document type:', err);
      const errorMessage = err.message || 'Failed to delete document type';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const toggleDocumentTypeStatus = async (id: string, isActive: boolean) => {
    return updateDocumentType(id, { is_active: isActive });
  };

  const reorderDocumentTypes = async (documentTypes: { id: string; display_order: number }[]) => {
    setError(null);
    try {
      const updates = documentTypes.map(({ id, display_order }) => 
        supabase
          .from('document_types')
          .update({ display_order })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const hasError = results.some(r => r.error);
      
      if (hasError) {
        throw new Error('Failed to reorder document types');
      }

      await fetchDocumentTypes();
      return { error: null };
    } catch (err: any) {
      console.error('Error reordering document types:', err);
      const errorMessage = err.message || 'Failed to reorder document types';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  return {
    documentTypes,
    loading,
    error,
    fetchDocumentTypes,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType,
    toggleDocumentTypeStatus,
    reorderDocumentTypes,
  };
}