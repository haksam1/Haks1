import { LayoutDashboard, Search, Settings, Shield, type LucideIcon } from 'lucide-react';

type BaseMenuItem = {
  name: string;
  icon: LucideIcon;
  permission?: string;
};

export type SingleMenuItem = BaseMenuItem & {
  type: 'single';
  path: string;
};

export type CategoryMenuItem = BaseMenuItem & {
  type: 'category';
  items: SingleMenuItem[];
};

export type MenuItem = SingleMenuItem | CategoryMenuItem;

export const menuItems: MenuItem[] = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    type: 'single',
    permission: 'view_dashboard',
  },
  {
    name: 'Search',
    icon: Search,
    path: '/search',
    type: 'single',
    permission: 'view_search',
  },
  {
    name: 'Roles & Permissions',
    icon: Shield,
    path: '/roles',
    type: 'single',
    permission: 'view_roles',
  },
  {
    name: 'Settings',
    icon: Settings,
    path: '/settings',
    type: 'single',
    permission: 'view_settings',
  },
];
