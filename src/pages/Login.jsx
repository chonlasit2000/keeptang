import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!email.includes('@') || password.length < 6) {
      setMessage('กรุณากรอกอีเมลให้ถูกต้อง และรหัสผ่านอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    const { error, data } = mode === 'login' ? await signIn(email, password) : await signUp(email, password);
    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === 'register' && !data.session) {
      setMessage('สมัครสำเร็จแล้ว กรุณายืนยันอีเมลถ้า Supabase เปิดการยืนยันไว้');
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-5 py-8 text-ink">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-soft">
        <img src="/icons/icon-192.png" alt="" className="mx-auto h-20 w-20 rounded-2xl" />
        <div className="mt-5 text-center">
          <p className="text-sm font-semibold text-coral">บันทึกเงินให้เป็นเรื่องง่าย</p>
          <h1 className="mt-1 text-4xl font-bold tracking-normal">keeptang</h1>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-2xl bg-cream p-1">
          {[
            ['login', 'เข้าสู่ระบบ'],
            ['register', 'สมัครสมาชิก']
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`rounded-[0.9rem] py-3 text-sm font-bold ${mode === key ? 'bg-white text-coral shadow-sm' : 'text-muted'}`}
              onClick={() => {
                setMode(key);
                setMessage('');
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="text-sm font-semibold">อีเมล</span>
            <input
              className="mt-2 w-full rounded-2xl border border-[#EAD8CA] bg-white px-4 py-3 outline-none focus:border-coral"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold">รหัสผ่าน</span>
            <input
              className="mt-2 w-full rounded-2xl border border-[#EAD8CA] bg-white px-4 py-3 outline-none focus:border-coral"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="อย่างน้อย 6 ตัวอักษร"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>

          {message ? <p className="rounded-2xl bg-expenseSoft px-4 py-3 text-sm font-semibold text-expense">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-coral px-5 py-4 text-base font-bold text-white shadow-soft disabled:opacity-60"
          >
            {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>
      </section>
    </main>
  );
}
