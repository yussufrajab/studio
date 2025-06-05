'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { EMPLOYEES, ROLES } from '@/lib/constants';
import type { Employee } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfilePage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      if (user.employeeId) {
        const foundEmployee = EMPLOYEES.find(e => e.id === user.employeeId);
        setEmployee(foundEmployee || null);
      } else if (role === ROLES.HRO) {
        // HRO might see a list or search, for now, show first employee as example if no specific context
        setEmployee(EMPLOYEES[0] || null);
      }
    }
    setLoading(false);
  }, [user, role, authLoading]);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  if (authLoading || loading) {
    return (
      <div>
        <PageHeader title="Employee Profile" />
        <Card>
          <CardHeader>
            <Skeleton className="h-24 w-24 rounded-full mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto mt-4" />
            <Skeleton className="h-4 w-1/3 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
            <Skeleton className="h-10 w-24 mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!employee && role === ROLES.EMPLOYEE) {
    return (
      <div>
        <PageHeader title="Employee Profile" />
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your employee profile could not be loaded. Please contact HR.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // For HRO, if no employee is selected yet (future feature: employee list/search for HRO)
  if (!employee && role === ROLES.HRO) {
    return (
      <div>
        <PageHeader title="Employee Profile Management" description="Search or select an employee to view/manage their profile."/>
         <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Select an employee to view their profile. (Functionality to search/select employee to be added)</p>
            {/* Display first employee for demo purposes */}
            {EMPLOYEES.length > 0 && (
              <Button onClick={() => setEmployee(EMPLOYEES[0])} className="mt-4">View Sample Profile ({EMPLOYEES[0].name})</Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div>
      <PageHeader title={role === ROLES.EMPLOYEE ? "My Profile" : `Profile: ${employee?.name || 'N/A'}`} description="View and manage employee information." />
      {employee ? (
        <Card>
          <CardHeader className="items-center text-center">
             <Avatar className="h-24 w-24 mb-4">
              <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(employee.name)}`} alt={employee.name} data-ai-hint="employee photo" />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl">{employee.name}</CardTitle>
            <CardDescription>ZanID: {employee.zanId} | Status: {employee.status || 'N/A'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" value={employee.name} readOnly={role !== ROLES.HRO} />
            </div>
            <div>
              <Label htmlFor="zanId">ZanID</Label>
              <Input id="zanId" value={employee.zanId} readOnly />
            </div>
            <div>
              <Label htmlFor="cadre">Cadre</Label>
              <Input id="cadre" value={employee.cadre || 'Not Specified'} readOnly={role !== ROLES.HRO} />
            </div>
            <div>
              <Label htmlFor="employeeStatus">Employment Status</Label>
              <Input id="employeeStatus" value={employee.status || 'N/A'} readOnly={role !== ROLES.HRO} />
            </div>
            {/* Add more fields as needed */}
            {(role === ROLES.EMPLOYEE || role === ROLES.HRO) && (
              <Button disabled={role === ROLES.EMPLOYEE}> {/* Enable for HRO if editing is allowed */}
                {role === ROLES.HRO ? 'Save Changes' : 'Update Profile (Disabled)'}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Employee Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Employee data is not available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
