import React, { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut, Menu } from 'lucide-react';
import { menuItems, type CategoryMenuItem, type SingleMenuItem } from '../config/menu';
import { useAuthContext } from '../context/AuthContext';

type AppLayoutProps = {
  children?: React.ReactNode;
};

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredMenuItems = useMemo(() => {
    if (!user || !user.permissions) return [];
    const perms = user.permissions;
    return menuItems.filter((item) => {
      if (item.type === 'single') {
        return !item.permission || perms.includes(item.permission);
      } else {
        const visibleChildren = item.items.filter(
          (child) => !child.permission || perms.includes(child.permission)
        );
        return visibleChildren.length > 0;
      }
    });
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileSidebar = () => setSidebarOpen(false);

  const isPathActive = (path: string) => {
    if (path === '/dashboard' && location.pathname.startsWith('/trees')) return true;
    return location.pathname === path;
  };

  const toggleCategory = (name: string) => {
    setOpenCategories((c) => ({ ...c, [name]: !c[name] }));
  };

  const renderSingleItem = (item: SingleMenuItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={closeMobileSidebar}
        className={({ isActive }) =>
          `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            isActive || isPathActive(item.path)
              ? 'bg-[#1a3a2a] text-[#a8d5b5]'
              : 'text-[#c8bfaa] hover:bg-[#1a3a2a]/60 hover:text-[#d4c9b0]'
          }`
        }
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
          <Icon size={15} />
        </span>
        <span className="tracking-wide">{item.name}</span>
      </NavLink>
    );
  };

  const renderCategoryItem = (item: CategoryMenuItem) => {
    const Icon = item.icon;
    const isOpen = openCategories[item.name];
    const isActive = item.items.some((child) => isPathActive(child.path));

    return (
      <div key={item.name} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleCategory(item.name)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
            isActive
              ? 'bg-[#1a3a2a] text-[#a8d5b5]'
              : 'text-[#c8bfaa] hover:bg-[#1a3a2a]/60 hover:text-[#d4c9b0]'
          }`}
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5">
            <Icon size={15} />
          </span>
          <span className="flex-1 text-left tracking-wide">{item.name}</span>
          <ChevronDown
            size={14}
            className={`text-[#c8bfaa]/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isOpen && (
          <div className="space-y-0.5 pl-4 pt-0.5">
            {item.items.map((child) => renderSingleItem(child))}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="flex h-full w-64 flex-col" style={{ background: '#0d2218' }}>
      {/* Logo area */}
      <div className="flex h-24 items-center border-b border-white/10 px-4">
        <Link to="/dashboard" onClick={closeMobileSidebar} className="flex items-center">
          <img
            src="/kincore_logo_v4.svg"
            alt="KinCore logo"
            className="h-20 w-56 shrink-0 object-contain"
          />
        </Link>
      </div>

      {/* Decorative divider */}
      <div className="mx-5 my-3 flex items-center gap-2">
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2d6a4f]/60 to-transparent" />
        <div className="h-1 w-1 rounded-full bg-[#2d6a4f]" />
        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#2d6a4f]/60 to-transparent" />
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c8bfaa]/40">
          Navigation
        </p>
        {filteredMenuItems.map((item) =>
          item.type === 'single' ? renderSingleItem(item) : renderCategoryItem(item)
        )}
      </nav>

      {/* User */}
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2d6a4f] text-xs font-bold text-[#95d5b2]">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#d4c9b0]">{user?.name}</p>
            <p className="truncate text-[11px] text-[#c8bfaa]/50">{user?.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#c8bfaa]/60 transition-all hover:bg-red-900/20 hover:text-red-400"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f4ef]">
      {/* Desktop sidebar */}
      <div className="hidden md:flex fixed inset-y-0 left-0 z-[100] w-64 shadow-2xl">
        <SidebarContent />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={closeMobileSidebar}
          className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-[120] w-64 transform shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </div>

      {/* Main content */}
      <div className="flex min-h-screen flex-col md:ml-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#e8e0d0] bg-[#f7f4ef]/95 px-4 backdrop-blur md:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-xl p-2 text-[#5a4a3a] transition hover:bg-[#e8e0d0]"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <Link to="/dashboard" className="flex items-center">
            <img
              src="/kincore_logo_v4.svg"
              alt="KinCore logo"
              className="h-12 w-36 shrink-0 object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl p-2 text-[#5a4a3a] transition hover:bg-red-50 hover:text-red-500"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </header>

        <main className="min-w-0 flex-1">{children ? children : <Outlet />}</main>
      </div>
    </div>
  );
};

export default AppLayout;
