
import {
  LayoutDashboard,
  UserCheck,
  CalendarOff,
  TrendingUp,
  MessageSquareWarning,
  Users,
  Briefcase,
  LogOut as LogOutIcon, 
  CalendarPlus,
  UserX,
  Ban,
  UserCog,
  BarChart3,
  ClipboardList,
  ShieldCheck, 
  Replace,
  UserMinus,
  ListChecks
} from 'lucide-react';
import type { NavItem, Role } from './types';
import { ROLES } from './constants';

export const NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO, ROLES.DO, ROLES.EMPLOYEE, ROLES.CSCS, ROLES.HRRP],
    description: 'Overview of your activities and quick access to modules.',
  },
  {
    title: 'Employee Profiles',
    href: '/dashboard/profile',
    icon: UserCog,
    roles: [ROLES.HRO, ROLES.EMPLOYEE, ROLES.HHRMD, ROLES.HRMO, ROLES.DO, ROLES.CSCS, ROLES.HRRP],
    description: 'View and manage employee profile information.',
  },
  {
    title: 'Employee Confirmation',
    href: '/dashboard/confirmation',
    icon: UserCheck,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO], // CSCS/HRRP view via Track Status/Dashboard
    description: 'Manage employee confirmation processes.',
  },
  {
    title: 'Leave Without Pay (LWOP)',
    href: '/dashboard/lwop',
    icon: CalendarOff,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO],
    description: 'Process and manage LWOP requests for employees.',
  },
  {
    title: 'Promotion',
    href: '/dashboard/promotion',
    icon: TrendingUp,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO],
    description: 'Handle employee promotion applications and approvals.',
  },
  {
    title: 'Complaints',
    href: '/dashboard/complaints',
    icon: MessageSquareWarning,
    roles: [ROLES.EMPLOYEE, ROLES.DO, ROLES.HHRMD],
    description: 'Submit, view, and manage employee complaints.',
  },
  {
    title: 'Change of Cadre',
    href: '/dashboard/cadre-change',
    icon: Replace,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO],
    description: 'Manage requests for change of employee cadre.',
  },
  {
    title: 'Retirement',
    href: '/dashboard/retirement',
    icon: UserMinus,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO],
    description: 'Process employee retirement applications.',
  },
  {
    title: 'Resignation',
    href: '/dashboard/resignation',
    icon: UserX, 
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO],
    description: 'Handle employee resignation submissions.',
  },
  {
    title: 'Service Extension',
    href: '/dashboard/service-extension',
    icon: CalendarPlus,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO],
    description: 'Manage requests for employee service extensions.',
  },
  {
    title: 'Termination',
    href: '/dashboard/termination',
    icon: ShieldAlert,
    roles: [ROLES.HRO, ROLES.DO, ROLES.HHRMD], 
    description: 'Process employee terminations due to misconduct or other reasons.',
  },
  {
    title: 'Dismissal',
    href: '/dashboard/dismissal',
    icon: Ban,
    roles: [ROLES.HRO, ROLES.DO, ROLES.HHRMD], 
    description: 'Handle dismissal of unconfirmed employees.',
  },
  {
    title: 'Track Status',
    href: '/dashboard/track-status',
    icon: ListChecks,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO, ROLES.DO, ROLES.CSCS, ROLES.HRRP],
    description: 'Track the status of submitted requests.',
  },
  {
    title: 'Reports & Analytics',
    href: '/dashboard/reports',
    icon: BarChart3,
    roles: [ROLES.HRO, ROLES.HHRMD, ROLES.HRMO, ROLES.DO, ROLES.CSCS, ROLES.HRRP],
    description: 'Generate and view various system reports.',
  },
  {
    title: 'Audit Trail',
    href: '/dashboard/audit-trail',
    icon: ClipboardList,
    roles: [ROLES.HRO, ROLES.CSCS], // CSCS might also need this
    disabled: true, 
    description: 'View a log of system activities and changes (coming soon).',
  },
];

export function getNavItemsForRole(role: Role | null): NavItem[] {
  if (!role) return [];
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}
