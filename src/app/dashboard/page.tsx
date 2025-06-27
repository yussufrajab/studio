
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  TrendingUp,
  CalendarOff,
  ShieldAlert,
  MessageSquareWarning,
  AlertTriangle,
} from 'lucide-react';
import { differenceInMonths, parseISO } from 'date-fns';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLES, EMPLOYEES } from '@/lib/constants';

const recentActivities = [
  { id: 'CONF-001', type: 'Confirmation', employee: 'Ali Juma Ali', status: 'Pending HHRMD', href: '/dashboard/confirmation' },
  { id: 'PROM-002', type: 'Promotion', employee: 'Safia Juma Ali', status: 'Approved', href: '/dashboard/promotion' },
  { id: 'LWOP-003', type: 'LWOP', employee: 'Fatma Said Omar', status: 'Pending HRMO', href: '/dashboard/lwop' },
  { id: 'COMP-001', type: 'Complaint', employee: 'Hassan Mzee Juma', status: 'Pending DO', href: '/dashboard/complaints' },
  { id: 'RET-004', type: 'Retirement', employee: 'Zainab Ali Khamis', status: 'Rejected', href: '/dashboard/retirement' },
];

const getStatusVariant = (status: string) => {
  if (status.toLowerCase().includes('approved')) return 'default';
  if (status.toLowerCase().includes('rejected')) return 'destructive';
  return 'secondary';
};

export default function DashboardPage() {
  const { isLoading, user, role } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && (role === ROLES.EMPLOYEE || role === ROLES.PO)) {
      router.replace('/dashboard/profile');
    }
  }, [isLoading, role, router]);

  const urgentCount = React.useMemo(() => {
    if (role !== ROLES.HRO && role !== ROLES.HRRP) return 0;
    if (!user?.institutionId) return 0;

    const institutionEmployees = EMPLOYEES.filter(e => e.institutionId === user.institutionId);

    const probationOverdue = institutionEmployees.filter(emp => {
      if (!emp.employmentDate || emp.status !== 'On Probation') return false;
      try {
        return differenceInMonths(new Date(), parseISO(emp.employmentDate)) >= 12;
      } catch {
        return false;
      }
    }).length;

    const nearingRetirement = institutionEmployees.filter(emp => {
      if (!emp.dateOfBirth) return false;
      try {
        const ageInYears = (new Date().getTime() - parseISO(emp.dateOfBirth).getTime()) / 31557600000; // 1000*60*60*24*365.25
        return ageInYears >= 59.5 && ageInYears < 60;
      } catch {
        return false;
      }
    }).length;
    
    return probationOverdue + nearingRetirement;
  }, [role, user]);


  if (isLoading || role === ROLES.EMPLOYEE || role === ROLES.PO) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Manage all your HR processes in one place." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-1/2 mb-1" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>An overview of the latest requests and their statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center">
                  <Skeleton className="h-6 w-1/4" />
                  <Skeleton className="ml-4 h-6 w-1/4" />
                  <Skeleton className="ml-4 h-6 w-1/4" />
                  <Skeleton className="ml-auto h-6 w-1/5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4">
      <PageHeader
        title="Dashboard"
        description="Manage all your HR processes in one place."
      />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">50,123</div>
            <p className="text-xs text-muted-foreground">Updated just now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15</div>
            <p className="text-xs text-muted-foreground">Updated just now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Promotions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Updated just now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees on LWOP</CardTitle>
            <CalendarOff className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Updated just now</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Terminations</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">Updated just now</p>
          </CardContent>
        </Card>
        {(role === ROLES.HRO || role === ROLES.HRRP) ? (
          <Link href="/dashboard/urgent-actions">
            <Card className="hover:bg-accent hover:text-accent-foreground transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Actions</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{urgentCount}</div>
                <p className="text-xs text-muted-foreground">Items needing review</p>
              </CardContent>
            </Card>
          </Link>
        ) : (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Complaints</CardTitle>
              <MessageSquareWarning className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Updated just now</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <div className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>An overview of the latest requests and their statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <Link href={activity.href} passHref legacyBehavior>
                        <a className="font-medium text-primary hover:underline">{activity.id}</a>
                      </Link>
                    </TableCell>
                    <TableCell>{activity.type}</TableCell>
                    <TableCell>{activity.employee}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={getStatusVariant(activity.status)}>{activity.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
