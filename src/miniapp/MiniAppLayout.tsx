import { Outlet, NavLink } from 'react-router-dom';
import { ShoppingCart, ClipboardList } from 'lucide-react';
import { useFarcasterUser } from './MiniAppProvider';

export function MiniAppLayout() {
  const user = useFarcasterUser();

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary">DP</span>
          </div>
          <span className="font-mono text-xs font-medium tracking-wide">DarkPool</span>
        </div>
        {user && (
          <div className="flex items-center gap-2">
            {user.pfpUrl && (
              <img src={user.pfpUrl} alt="" className="w-5 h-5 rounded-full" />
            )}
            <span className="font-mono text-[10px] text-white/50">
              @{user.username || `fid:${user.fid}`}
            </span>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="flex items-center border-t border-white/[0.06] bg-white/[0.02] shrink-0">
        <NavLink
          to="/miniapp"
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-mono transition-colors ${
              isActive ? 'text-primary' : 'text-white/40 hover:text-white/60'
            }`
          }
        >
          <ShoppingCart className="w-4 h-4" />
          Market
        </NavLink>
        <NavLink
          to="/miniapp/orders"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-mono transition-colors ${
              isActive ? 'text-primary' : 'text-white/40 hover:text-white/60'
            }`
          }
        >
          <ClipboardList className="w-4 h-4" />
          Orders
        </NavLink>
      </nav>
    </div>
  );
}
