import {
  LayoutDashboard,
  UserCheck,
  CalendarOff,
  TrendingUp,
  MessageSquareWarning,
  Users,
  Briefcase,
  LogOut as LogOutIcon, // Renamed to avoid conflict
  CalendarPlus,
  UserX,
  Ban,
  UserCog,
  BarChart3,
  ClipboardList,
  ShieldAlert,
  Replace,
  UserMinus
} from 'lucide-react';
import type { NavItem, Role } from './types';
import { ROLES } from './constants';

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO, ROLES.DO, ROLES.EMPLOYEE],
  },
  {
    title: 'Employee Profiles',
    href: '/dashboard/profile', // Could be /dashboard/profiles for HRO listing
    icon: UserCog,
    roles: [ROLES.HRO, ROLES.EMPLOYEE],
  },
  {
    title: 'Employee Confirmation',
    href: '/dashboard/confirmation',
    icon: UserCheck,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO],
  },
  {
    title: 'Leave Without Pay (LWOP)',
    href: '/dashboard/lwop',
    icon: CalendarOff,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO],
  },
  {
    title: 'Promotion',
    href: '/dashboard/promotion',
    icon: TrendingUp,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO],
  },
  {
    title: 'Complaints',
    href: '/dashboard/complaints',
    icon: MessageSquareWarning,
    roles: [ROLES.EMPLOYEE, ROLES.DO, ROLES.HHRMD_HRMO], // HHRMD_HRMO might view/manage all complaints
  },
  {
    title: 'Change of Cadre',
    href: '/dashboard/cadre-change',
    icon: Replace,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO],
  },
  {
    title: 'Retirement',
    href: '/dashboard/retirement',
    icon: UserMinus,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO],
  },
  {
    title: 'Resignation',
    href: '/dashboard/resignation',
    icon: UserX, // More specific than LogOutIcon for menu item
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO],
  },
  {
    title: 'Service Extension',
    href: '/dashboard/service-extension',
    icon: CalendarPlus,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO],
  },
  {
    title: 'Termination',
    href: '/dashboard/termination',
    icon: UserX,
    roles: [ROLES.HRO, ROLES.DO],
  },
  {
    title: 'Dismissal',
    href: '/dashboard/dismissal',
    icon: Ban,
    roles: [ROLES.HRO, ROLES.DO],
  },
  {
    title: 'Reports & Analytics',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO, ROLES.DO],
    disabled: true, // For future implementation
  },
  {
    title: 'Audit Trail',
    href: '/dashboard/audit-trail',
    icon: ClipboardList,
    roles: [ROLES.HRO, ROLES.HHRMD_HRMO, ROLES.DO],
    disabled: true, // For future implementation
  },
];

export function getNavItemsForRole(role: Role | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}
