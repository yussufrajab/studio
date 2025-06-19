
'use client';

import * as React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { getNavItemsForRole } from '@/lib/navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLES } from '@/lib/constants'; 
import { toast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';
import type { Role as UserRoleType } from '@/lib/types';


interface MockNotification {
  id: string;
  title: string;
  description: React.ReactNode;
  href: string; // For the link component
  relevantRoles: UserRoleType[];
  icon?: React.ElementType;
}


export default function DashboardPage() {
  const { user, role, isLoading } = useAuth();

  React.useEffect(() => {
    if (isLoading || !role || !user) return;

    // Simulate fetching notifications after login
    const getMockNotificationsForRole = (currentRole: UserRoleType): MockNotification[] => {
      const allNotifications: MockNotification[] = [
        {
          id: 'complaint_update_comp001',
          title: "Complaint Update",
          description: (
            <>
              Status of complaint COMP001 has changed.{" "}
              <Link href="/dashboard/complaints" className="font-semibold text-primary hover:underline">
                View Complaints
              </Link>
            </>
          ),
          href: "/dashboard/complaints",
          relevantRoles: [ROLES.DO, ROLES.HHRMD, ROLES.EMPLOYEE], 
          icon: BellRing,
        },
        {
          id: 'promotion_update_prom001',
          title: "Promotion Status Change",
          description: (
            <>
              Promotion request PROM001 for Zainab Ali Khamis has been forwarded for HHRMD review.{" "}
              <Link href="/dashboard/promotion" className="font-semibold text-primary hover:underline">
                View Promotions
              </Link>
            </>
          ),
          href: "/dashboard/promotion",
          relevantRoles: [ROLES.HRO, ROLES.HHRMD],
          icon: BellRing,
        },
        {
          id: 'retirement_decision_retire002',
          title: "Retirement Request Approved",
          description: (
            <>
              Retirement request RETIRE002 for Juma Omar Ali has been approved by the Commission.{" "}
              <Link href="/dashboard/retirement" className="font-semibold text-primary hover:underline">
                View Retirements
              </Link>
            </>
          ),
          href: "/dashboard/retirement",
          relevantRoles: [ROLES.HRO, ROLES.HRMO, ROLES.CSCS, ROLES.PO, ROLES.HRRP],
          icon: BellRing,
        },
         {
          id: 'new_report_cscs_po',
          title: "New Monthly Report",
          description: (
            <>
              The consolidated monthly HR activity report is now available.{" "}
              <Link href="/dashboard/reports" className="font-semibold text-primary hover:underline">
                Access Reports
              </Link>
            </>
          ),
          href: "/dashboard/reports",
          relevantRoles: [ROLES.CSCS, ROLES.PO],
          icon: BellRing,
        },
        {
          id: 'confirmation_pending_cscs_hrrp',
          title: "Confirmations Awaiting Commission",
          description: (
            <>
              There are 5 confirmation requests awaiting final Commission decision.{" "}
              <Link href="/dashboard/track-status?type=Confirmation&status=AwaitingCommission" className="font-semibold text-primary hover:underline">
                Track Status
              </Link>
            </>
          ),
          href: "/dashboard/track-status", // Simplified link, actual filtering would be more complex
          relevantRoles: [ROLES.CSCS, ROLES.HRRP, ROLES.PO],
          icon: BellRing,
        }
      ];

      return allNotifications.filter(notif => notif.relevantRoles.includes(currentRole));
    };

    // Simulate a short delay to mimic fetching notifications after page load/login
    const timer = setTimeout(() => {
      if (role) { // Ensure role is not null
        const userNotifications = getMockNotificationsForRole(role);
        userNotifications.forEach(notif => {
          toast({
            title: (
              <div className="flex items-center">
                {notif.icon && <notif.icon className="mr-2 h-5 w-5" />}
                {notif.title}
              </div>
            ),
            description: notif.description,
            duration: 15000, // Keep it visible for a bit longer
          });
        });
      }
    }, 500); // 0.5 second delay

    return () => clearTimeout(timer);

  }, [role, user, isLoading, toast]);


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
        {roleNavItems.map((item) => {
          let description = item.description || `Manage ${item.title.toLowerCase()}.`;
          // Conditional description for Complaints module for roles that manage complaints
          if (item.href === '/dashboard/complaints' && (role === ROLES.DO || role === ROLES.HHRMD)) {
            description = 'View and Manage employee complaints.';
          }

          return (
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
                      {description}
                    </p>
                  </CardContent>
                </Card>
              </a>
            </Link>
          );
        })}
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

