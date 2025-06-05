'use client';

import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getNavItemsForRole } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, role, isLoading } = useAuth();

  if (isLoading || !user || !role) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your activities." />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-1" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const roleNavItems = getNavItemsForRole(role).filter(item => item.href !== '/dashboard' && !item.disabled);

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user.name}!`}
        description={`Your ${role} dashboard. Access your modules below.`}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {roleNavItems.map((item) => (
          <Link href={item.href} key={item.href} passHref legacyBehavior>
            <a className="block hover:no-underline">
              <Card className="h-full hover:shadow-lg transition-shadow duration-200 ease-in-out hover:border-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium font-headline">
                    {item.title}
                  </CardTitle>
                  <item.icon className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {item.description || `Manage ${item.title.toLowerCase()}.`}
                  </p>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
        {roleNavItems.length === 0 && (
          <Card>
            <CardHeader>
              <CardTitle>No Modules Available</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">There are no modules assigned to your role at this time.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Example Stats - to be made dynamic */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+5 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">345</div>
            <p className="text-xs text-muted-foreground">Managed by the commission</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
