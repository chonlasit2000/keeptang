import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const transactionSelect = `
  *,
  category:categories (
    id,
    name,
    icon,
    color,
    type,
    grp
  )
`;

export function useTransactions({ startDate, endDate, categoryId } = {}) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');

    let query = supabase
      .from('transactions')
      .select(transactionSelect)
      .order('txn_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (startDate) query = query.gte('txn_date', startDate);
    if (endDate) query = query.lte('txn_date', endDate);
    if (categoryId) query = query.eq('category_id', categoryId);

    const { data, error: fetchError } = await query;

    if (fetchError) {
      setError(fetchError.message);
      setLoading(false);
      return;
    }

    setTransactions(data || []);
    setLoading(false);
  }, [categoryId, endDate, startDate, user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return { transactions, loading, error, reload: loadTransactions };
}

export async function getTransaction(id) {
  const { data, error } = await supabase.from('transactions').select(transactionSelect).eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function saveTransaction(userId, payload, id) {
  const row = { ...payload, user_id: userId };
  const query = id
    ? supabase.from('transactions').update(row).eq('id', id).select().single()
    : supabase.from('transactions').insert(row).select().single();
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
