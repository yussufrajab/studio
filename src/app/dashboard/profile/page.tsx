
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { EMPLOYEES, ROLES } from '@/lib/constants';
import type { Employee, EmployeeCertificate } from '@/lib/types';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, UserCircle, Building, Briefcase, Award } from 'lucide-react';

export default function ProfilePage() {
  const { user, role, isLoading: authLoading } = useAuth();
  const [profileData, setProfileData] = useState<Employee | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  // HRO Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'zanId' | 'zssfNumber' | 'payrollNumber'>('zanId');
  const [isSearching, setIsSearching] = useState(false);

  const canSearch = role === ROLES.HRO || role === ROLES.HHRMD || role === ROLES.HRMO || role === ROLES.DO || role === ROLES.CSCS || role === ROLES.HRRP;

  useEffect(() => {
    setPageLoading(true);
    if (!authLoading && user) {
      if (role === ROLES.EMPLOYEE && user.employeeId) {
        const foundEmployee = EMPLOYEES.find(e => e.id === user.employeeId);
        setProfileData(foundEmployee || null);
        if (!foundEmployee) {
          toast({ title: "Profile Not Found", description: "Your employee profile could not be loaded. Please contact HR.", variant: "destructive" });
        }
      } else if (canSearch) {
        setProfileData(null); 
      }
    }
    setPageLoading(false);
  }, [user, role, authLoading, canSearch]);

  const getInitials = (name?: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      toast({ title: "Search Term Required", description: "Please enter a search term.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setProfileData(null);
    setTimeout(() => { 
      const found = EMPLOYEES.find(emp => {
        if (searchType === 'zanId') return emp.zanId === searchTerm.trim();
        if (searchType === 'zssfNumber') return emp.zssfNumber === searchTerm.trim();
        if (searchType === 'payrollNumber') return emp.payrollNumber === searchTerm.trim();
        return false;
      });
      setProfileData(found || null);
      if (found) {
        toast({ title: "Employee Found", description: `Details for ${found.name} loaded.` });
      } else {
        toast({ title: "Employee Not Found", description: `No employee found with the provided ${searchType}: ${searchTerm}.`, variant: "destructive" });
      }
      setIsSearching(false);
    }, 1000);
  };

  const renderEmployeeDetails = (emp: Employee) => (
    <Card className="mt-6 shadow-lg">
      <CardHeader className="items-center text-center border-b pb-6">
        <Avatar className="h-24 w-24 mb-4 shadow-md">
          <AvatarImage src={emp.profileImageUrl || `https://placehold.co/100x100.png?text=${getInitials(emp.name)}`} alt={emp.name} data-ai-hint="employee photo"/>
          <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-2xl font-headline">{emp.name}</CardTitle>
        <CardDescription>ZanID: {emp.zanId} | Status: <span className={`font-semibold ${emp.status === 'Confirmed' ? 'text-green-600' : 'text-orange-500'}`}>{emp.status || 'N/A'}</span></CardDescription>
      </CardHeader>
      <CardContent className="pt-6 space-y-8">
        
        <section>
          <div className="flex items-center mb-4">
            <UserCircle className="h-6 w-6 mr-3 text-primary" />
            <h3 className="text-xl font-semibold font-headline text-foreground">Personal Information</h3>
          </div>
          <Card className="bg-secondary/20 shadow-sm">
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
              <div><Label className="text-muted-foreground">Full Name:</Label><p className="font-medium text-foreground">{emp.name}</p></div>
              <div><Label className="text-muted-foreground">ZanID:</Label><p className="font-medium text-foreground">{emp.zanId}</p></div>
              <div><Label className="text-muted-foreground">ZSSF Number:</Label><p className="font-medium text-foreground">{emp.zssfNumber || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Payroll Number:</Label><p className="font-medium text-foreground">{emp.payrollNumber || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Date of Birth:</Label><p className="font-medium text-foreground">{emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString() : 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Place of Birth:</Label><p className="font-medium text-foreground">{emp.placeOfBirth || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Region:</Label><p className="font-medium text-foreground">{emp.region || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Country of Birth:</Label><p className="font-medium text-foreground">{emp.countryOfBirth || 'N/A'}</p></div>
            </CardContent>
          </Card>
        </section>

        
        <section>
           <div className="flex items-center mb-4">
            <Briefcase className="h-6 w-6 mr-3 text-primary" />
            <h3 className="text-xl font-semibold font-headline text-foreground">Employment Summary</h3>
          </div>
          <Card className="bg-secondary/20 shadow-sm">
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4 text-sm">
              <div><Label className="text-muted-foreground">Rank (Cadre):</Label><p className="font-medium text-foreground">{emp.cadre || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Ministry:</Label><p className="font-medium text-foreground">{emp.ministry || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Institution:</Label><p className="font-medium text-foreground">{emp.institution || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Department:</Label><p className="font-medium text-foreground">{emp.department || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Appointment Type:</Label><p className="font-medium text-foreground">{emp.appointmentType || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Contract Type:</Label><p className="font-medium text-foreground">{emp.contractType || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Recent Title Date:</Label><p className="font-medium text-foreground">{emp.recentTitleDate ? new Date(emp.recentTitleDate).toLocaleDateString() : 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Current Reporting Office:</Label><p className="font-medium text-foreground">{emp.currentReportingOffice || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Current Workplace:</Label><p className="font-medium text-foreground">{emp.currentWorkplace || 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Employment Date:</Label><p className="font-medium text-foreground">{emp.employmentDate ? new Date(emp.employmentDate).toLocaleDateString() : 'N/A'}</p></div>
              <div><Label className="text-muted-foreground">Confirmation Date:</Label><p className="font-medium text-foreground">{emp.confirmationDate ? new Date(emp.confirmationDate).toLocaleDateString() : 'N/A'}</p></div>
            </CardContent>
          </Card>
        </section>

        
        <section>
          <div className="flex items-center mb-4">
            <FileText className="h-6 w-6 mr-3 text-primary" />
            <h3 className="text-xl font-semibold font-headline text-foreground">Employee Documents</h3>
          </div>
          <Card className="bg-secondary/20 shadow-sm mb-6">
            <CardHeader className="pb-3 pt-4">
                 <CardTitle className="text-base">Core Documents</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-4 space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-md border bg-background">
                <Label className="font-medium text-foreground">Ardhil-hali:</Label>
                {emp.ardhilHaliUrl ? <Button asChild variant="link" size="sm"><a href={emp.ardhilHaliUrl} target="_blank" rel="noopener noreferrer">View Document</a></Button> : <span className="text-muted-foreground">Not Available</span>}
              </div>
              <div className="flex items-center justify-between p-3 rounded-md border bg-background">
                <Label className="font-medium text-foreground">Confirmation Letter:</Label>
                {emp.confirmationLetterUrl ? <Button asChild variant="link" size="sm"><a href={emp.confirmationLetterUrl} target="_blank" rel="noopener noreferrer">View Document</a></Button> : <span className="text-muted-foreground">Not Available</span>}
              </div>
            </CardContent>
          </Card>
           <Card className="bg-secondary/20 shadow-sm">
             <CardHeader className="pb-3 pt-4">
                 <div className="flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary" />
                    <CardTitle className="text-base">Employee Certificates</CardTitle>
                 </div>
            </CardHeader>
            <CardContent className="pt-0 pb-4 space-y-3 text-sm">
              {(emp.certificates && emp.certificates.length > 0) ? (
                emp.certificates.map((cert: EmployeeCertificate, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-md border bg-background">
                    <div>
                      <Label className="font-medium text-foreground">{cert.type}:</Label>
                      <p className="text-muted-foreground text-xs">{cert.name}</p>
                    </div>
                    {cert.url ? <Button asChild variant="link" size="sm"><a href={cert.url} target="_blank" rel="noopener noreferrer">View Document</a></Button> : <span className="text-muted-foreground">Not Available</span>}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground p-3">No certificates available for this employee.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </CardContent>
    </Card>
  );

  if (authLoading || pageLoading) {
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
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3 mt-4">
                <Skeleton className="h-5 w-1/4 mb-2" />
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title={canSearch ? "Employee Profile Management" : "My Profile"} 
        description={canSearch ? "Search for an employee to view their detailed profile." : "View your comprehensive employee information."} 
      />

      {canSearch && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Search Employee</CardTitle>
            <CardDescription>Enter ZanID, ZSSF number, or Payroll number to find an employee.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="searchTerm">Search Term</Label>
                <Input 
                  id="searchTerm" 
                  placeholder={`Enter ${searchType.replace(/([A-Z])/g, ' $1')}`}
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  disabled={isSearching} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="searchType">Search By</Label>
                <Select value={searchType} onValueChange={(value) => setSearchType(value as typeof searchType)} disabled={isSearching}>
                  <SelectTrigger id="searchTypeSelect">
                    <SelectValue placeholder="Select search type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zanId">ZanID</SelectItem>
                    <SelectItem value="zssfNumber">ZSSF Number</SelectItem>
                    <SelectItem value="payrollNumber">Payroll Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSearch} disabled={isSearching || !searchTerm.trim()}>
              {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
              Search Employee
            </Button>
          </CardContent>
        </Card>
      )}

      {profileData ? (
        renderEmployeeDetails(profileData)
      ) : (
        role === ROLES.EMPLOYEE && !authLoading && !pageLoading && ( 
          <Card>
            <CardHeader>
              <CardTitle>Profile Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your employee profile could not be loaded. Please contact HR.</p>
            </CardContent>
          </Card>
        )
      )}
      
      {canSearch && !isSearching && !profileData && searchTerm && ( 
         <Card className="mt-6">
            <CardHeader>
              <CardTitle>No Results</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">No employee found matching your search criteria. Please try again with different details.</p>
            </CardContent>
          </Card>
      )}
    </div>
  );
}
