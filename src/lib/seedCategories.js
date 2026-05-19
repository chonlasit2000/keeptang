import { supabase } from './supabase.js';
import { defaultCategories } from './defaultCategories.js';

export async function seedDefaultCategories(userId) {
  if (!userId) return;
  const rows = defaultCategories.map((category) => ({
    ...category,
    user_id: userId
  }));

  const { error } = await supabase
    .from('categories')
    .upsert(rows, { onConflict: 'user_id,type,name', ignoreDuplicates: true });

  if (error) throw error;
}
