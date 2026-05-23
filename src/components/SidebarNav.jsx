import { NavLink, Link } from 'react-router-dom';
import { BarChart3, Home, List, Plus, Settings } from 'lucide-react';

const items = [
  { to: '/', label: 'หน้าแรก', icon: Home },
  { to: '/transactions', label: 'รายการ', icon: List },
  { to: '/stats', label: 'สถิติ', icon: BarChart3 },
  { to: '/settings', label: 'ตั้งค่า', icon: Settings }
];

export default function SidebarNav() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-[#F0DED1] bg-white/85 p-5 md:block">
      <div className="flex items-center gap-3">
        <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-2xl" />
        <div>
          <p className="text-xl font-bold">keeptang</p>
          <p className="text-xs font-semibold text-muted">บันทึกรายรับรายจ่าย</p>
        </div>
      </div>

      <Link to="/add" className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-coral px-4 py-3 text-sm font-bold text-white shadow-soft">
        <Plus className="h-5 w-5" />
        เพิ่มรายการ
      </Link>

      <nav className="mt-6 space-y-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold ${
                isActive ? 'bg-[#F8D6C8] text-coral' : 'text-muted hover:bg-cream'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
