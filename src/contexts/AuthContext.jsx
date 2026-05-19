import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { seedDefaultCategories } from '../lib/seedCategories.js';

const AuthContext = createContext(null);
const pendingSeedEmailKey = 'keeptang.pendingSeedEmail';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seedError, setSeedError] = useState('');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) {
        await seedPendingSignupCategories(data.session.user, setSeedError);
      }
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await seedPendingSignupCategories(nextSession.user, setSeedError);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user || null,
      loading,
      seedError,
      clearSeedError: () => setSeedError(''),
      signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
      signUp: async (email, password) => {
        const result = await supabase.auth.signUp({ email, password });
        if (!result.error) {
          if (result.data.session?.user) {
            try {
              await seedDefaultCategories(result.data.session.user.id);
              notifyCategoriesSeeded();
            } catch {
              localStorage.setItem(pendingSeedEmailKey, result.data.session.user.email);
              setSeedError('ยังสร้างหมวดหมู่ตั้งต้นไม่สำเร็จ ระบบจะลองใหม่เมื่อเข้าสู่ระบบครั้งถัดไป');
            }
          } else if (result.data.user?.email) {
            localStorage.setItem(pendingSeedEmailKey, result.data.user.email);
          }
        }
        return result;
      },
      signOut: () => supabase.auth.signOut()
    }),
    [loading, seedError, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

async function seedPendingSignupCategories(user, setSeedError) {
  const pendingEmail = localStorage.getItem(pendingSeedEmailKey);
  if (!pendingEmail || pendingEmail !== user.email) return;
  try {
    await seedDefaultCategories(user.id);
    localStorage.removeItem(pendingSeedEmailKey);
    notifyCategoriesSeeded();
  } catch {
    setSeedError('ยังสร้างหมวดหมู่ตั้งต้นไม่สำเร็จ กรุณาตรวจว่าได้รัน Supabase schema แล้ว');
  }
}

function notifyCategoriesSeeded() {
  window.dispatchEvent(new Event('keeptang:categoriesSeeded'));
}
