
'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { differenceInMonths, parseISO, format } from 'date-fns';
import type { Employee } from '@/lib/types';

// Helper function to calculate precise age
const calculateAge = (dob: string) => {
  if (!dob) return 'N/A';
  try {
    const birthDate = parseISO(dob);
    const ageInMilliseconds = new Date().getTime() - birthDate.getTime();
    return (ageInMilliseconds / 31557600000).toFixed(1); // 31557600000 = 1000 * 60 * 60 * 24 * 365.25
  } catch {
    return 'N/A';
  }
};

export default function UrgentActionsPage() {
  const { user, role } = useAuth();
  
  const isAuthorized = role === ROLES.HRO || role === ROLES.HRRP;

  const { probationOverdue, nearingRetirement } = useMemo(() => {
    if (!isAuthorized || !user?.institutionId) {
      return { probationOverdue: [], nearingRetirement: [] };
    }

    const institutionEmployees = EMPLOYEES.filter(e => e.institutionId === user.institutionId);

    const overdue: Employee[] = institutionEmployees.filter(emp => {
      if (!emp.employmentDate || emp.status !== 'On Probation') return false;
      try {
        return differenceInMonths(new Date(), parseISO(emp.employmentDate)) >= 12;
      } catch {
        return false;
      }
    });

    const retiring: Employee[] = institutionEmployees.filter(emp => {
      if (!emp.dateOfBirth) return false;
      try {
        const age = parseFloat(calculateAge(emp.dateOfBirth) as string);
        return age >= 59.5 && age < 60;
      } catch {
        return false;
      }
    });

    return { probationOverdue: overdue, nearingRetirement: retiring };
  }, [isAuthorized, user?.institutionId]);

  if (!isAuthorized) {
    return (
      <div>
        <PageHeader title="Access Denied" />
        <Card>
          <CardContent className="pt-6">
            <p>You do not have permission to view this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Urgent Actions" description={`Urgent items for your institution.`} />

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Overdue Confirmations</CardTitle>
            <CardDescription>Employees on probation for 12 or more months who need confirmation.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ZanID</TableHead>
                  <TableHead>Employment Date</TableHead>
                  <TableHead>Months on Probation</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {probationOverdue.length > 0 ? (
                  probationOverdue.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.zanId}</TableCell>
                      <TableCell>{emp.employmentDate ? format(parseISO(emp.employmentDate), 'PPP') : 'N/A'}</TableCell>
                      <TableCell>{emp.employmentDate ? differenceInMonths(new Date(), parseISO(emp.employmentDate)) : 'N/A'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No employees with overdue confirmations.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employees Nearing Retirement</CardTitle>
            <CardDescription>Employees aged 59.5 years or older who need to begin the retirement process.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>ZanID</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Current Age</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nearingRetirement.length > 0 ? (
                  nearingRetirement.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.zanId}</TableCell>
                      <TableCell>{emp.dateOfBirth ? format(parseISO(emp.dateOfBirth), 'PPP') : 'N/A'}</TableCell>
                      <TableCell>{calculateAge(emp.dateOfBirth as string)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">No employees nearing retirement.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
