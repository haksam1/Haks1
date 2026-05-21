import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { LayoutDashboard, Search, Settings, LogOut } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import BrandLogo from './BrandLogo';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Search', icon: Search, path: '/search' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <nav className="bg-white border-b px-6 py-3 flex justify-between items-center h-24">
      <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
        <BrandLogo markClassName="h-16 w-36" />
      </Link>

      <div className="flex items-center gap-8">
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 font-medium transition hover:text-emerald-600",
                location.pathname === item.path ? "text-emerald-600" : "text-gray-500"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 pl-8 border-l">
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold text-gray-900 leading-none">{user?.name}</div>
            <div className="text-xs text-gray-500 mt-1">{user?.email}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 transition"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
