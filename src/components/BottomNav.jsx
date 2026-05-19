import { NavLink } from 'react-router-dom';
import { Home, List, Settings } from 'lucide-react';

const items = [
  { to: '/', label: 'หน้าแรก', icon: Home },
  { to: '/transactions', label: 'รายการ', icon: List },
  { to: '/settings', label: 'ตั้งค่า', icon: Settings }
];

export default function BottomNav() {
  return (
    <nav className="safe-bottom fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-[#F0DED1] bg-white/95 px-4 pt-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-3 gap-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold ${
                isActive ? 'bg-[#F8D6C8] text-coral' : 'text-muted'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
