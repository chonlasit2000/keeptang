import { useCallback, useEffect, useRef, useState } from 'react';
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
  const requestIdRef = useRef(0);

  const loadTransactions = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (!user) return;
    setLoading(true);
    setError('');

    const buildQuery = () => {
      let query = supabase
        .from('transactions')
        .select(transactionSelect)
        .order('txn_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (startDate) query = query.gte('txn_date', startDate);
      if (endDate) query = query.lte('txn_date', endDate);
      if (categoryId) query = query.eq('category_id', categoryId);

      return query;
    };

    const pageSize = 1000;
    const rows = [];
    let from = 0;
    let hasMore = true;

    while (hasMore) {
      const { data, error: fetchError } = await buildQuery().range(from, from + pageSize - 1);
      if (requestId !== requestIdRef.current) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      rows.push(...(data || []));
      hasMore = Boolean(data && data.length === pageSize);
      from += pageSize;
    }

    if (requestId !== requestIdRef.current) return;
    setTransactions(rows);
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
