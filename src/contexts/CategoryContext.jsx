import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { supabase } from '../lib/supabase.js';

const CategoryContext = createContext(null);

export function CategoryProvider({ children }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .order('type', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setCategories(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    window.addEventListener('keeptang:categoriesSeeded', loadCategories);
    return () => window.removeEventListener('keeptang:categoriesSeeded', loadCategories);
  }, [loadCategories]);

  const addCategory = useCallback(async (category) => {
    const { error: addError } = await supabase.from('categories').insert({
      ...category,
      user_id: user.id,
      sort_order: categories.length
    });
    if (addError) throw addError;
    await loadCategories();
  }, [categories.length, loadCategories, user]);

  const updateCategory = useCallback(async (id, updates) => {
    const { error: updateError } = await supabase.from('categories').update(updates).eq('id', id);
    if (updateError) throw updateError;
    await loadCategories();
  }, [loadCategories]);

  const deleteCategory = useCallback(async (id) => {
    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id);
    if (deleteError) throw deleteError;
    await loadCategories();
  }, [loadCategories]);

  const value = useMemo(
    () => ({
      categories,
      loading,
      error,
      reload: loadCategories,
      addCategory,
      updateCategory,
      deleteCategory
    }),
    [addCategory, categories, deleteCategory, error, loading, loadCategories, updateCategory]
  );

  return <CategoryContext.Provider value={value}>{children}</CategoryContext.Provider>;
}

export function useCategoryContext() {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useCategories must be used within CategoryProvider');
  return context;
}
