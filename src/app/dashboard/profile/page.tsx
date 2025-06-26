
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
import React, { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, UserCircle, Building, Briefcase, Award, ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';

// Helper function to get initials for avatar
const getInitials = (name?: string) => {
  if (!name) return '??';
  const names = name.split(' ');
  if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
  return (names[0][0] + names[names.length - 1][0]).toUpperCase();
};

const CERTIFICATE_ORDER: EmployeeCertificate['type'][] = ['Certificate', 'Diploma', 'Bachelor Degree', 'Master Degree'];

// Component to render the detailed profile view
const EmployeeDetailsCard = ({ emp, onBack }: { emp: Employee, onBack: () => void }) => (
  <Card className="mt-6 shadow-lg">
    <CardHeader className="border-b pb-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back to list</span>
        </Button>
        <div className="flex-grow text-center pr-8">
            <Avatar className="h-24 w-24 mb-4 shadow-md mx-auto">
            <AvatarImage src={emp.profileImageUrl || `https://placehold.co/100x100.png?text=${getInitials(emp.name)}`} alt={emp.name} data-ai-hint="employee photo"/>
            <AvatarFallback>{getInitials(emp.name)}</AvatarFallback>
            </Avatar>
            <CardTitle className="text-2xl font-headline">{emp.name}</CardTitle>
            <CardDescription>ZanID: {emp.zanId} | Status: <span className={`font-semibold ${emp.status === 'Confirmed' ? 'text-green-600' : 'text-orange-500'}`}>{emp.status || 'N/A'}</span></CardDescription>
        </div>
      </div>
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
            <div><Label className="text-muted-foreground">Gender:</Label><p className="font-medium text-foreground">{emp.gender}</p></div>
            <div><Label className="text-muted-foreground">ZanID:</Label><p className="font-medium text-foreground">{emp.zanId}</p></div>
            <div><Label className="text-muted-foreground">Phone Number:</Label><p className="font-medium text-foreground">{emp.phoneNumber || 'N/A'}</p></div>
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
            <div><Label className="text-muted-foreground">Salary Scale:</Label><p className="font-medium text-foreground">{emp.salaryScale || 'N/A'}</p></div>
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
            <div><Label className="text-muted-foreground">Retirement Date:</Label><p className="font-medium text-foreground">{emp.retirementDate ? new Date(emp.retirementDate).toLocaleDateString() : 'N/A'}</p></div>
          </CardContent>
        </Card>
      </section>
      <section>
        <div className="flex items-center mb-4">
          <FileText className="h-6 w-6 mr-3 text-primary" />
          <h3 className="text-xl font-semibold font-headline text-foreground">Employee Documents</h3>
        </div>
        <Card className="bg-secondary/20 shadow-sm mb-6">
          <CardHeader className="pb-3 pt-4"><CardTitle className="text-base">Core Documents</CardTitle></CardHeader>
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
           <CardHeader className="pb-3 pt-4"><div className="flex items-center"><Award className="h-5 w-5 mr-2 text-primary" /><CardTitle className="text-base">Employee Certificates</CardTitle></div></CardHeader>
          <CardContent className="pt-0 pb-4 space-y-3 text-sm">
            {CERTIFICATE_ORDER.map((certType) => {
              const cert = emp.certificates?.find(c => c.type === certType);
              return (
                <div key={certType} className="flex items-center justify-between p-3 rounded-md border bg-background">
                  <div>
                    <Label className="font-medium text-foreground">{certType}:</Label>
                    {cert ? (
                      <p className="text-muted-foreground text-xs">{cert.name}</p>
                    ) : (
                      <p className="text-muted-foreground text-xs italic">Not Available</p>
                    )}
                  </div>
                  {cert?.url ? (
                    <Button asChild variant="link" size="sm">
                      <a href={cert.url} target="_blank" rel="noopener noreferrer">View Document</a>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground text-xs">No Document</span>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>
    </CardContent>
  </Card>
);

export default function ProfilePage() {
  const { user, role, isLoading: authLoading } = useAuth();
  
  const [allEmployeesForUser, setAllEmployeesForUser] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageLoading, setPageLoading] = useState(true);

  const isCommissionUser = useMemo(() => 
    role === ROLES.HHRMD || role === ROLES.HRMO || role === ROLES.DO || role === ROLES.CSCS || role === ROLES.PO,
    [role]
  );
  
  const isInstitutionalViewer = useMemo(() => 
    role === ROLES.HRO || role === ROLES.HRRP,
    [role]
  );

  useEffect(() => {
    setPageLoading(true);
    if (!authLoading && user) {
      if (role === ROLES.EMPLOYEE && user.employeeId) {
        const foundEmployee = EMPLOYEES.find(e => e.id === user.employeeId);
        setSelectedEmployee(foundEmployee || null);
        if (!foundEmployee) toast({ title: "Profile Not Found", description: "Your employee profile could not be loaded. Please contact HR.", variant: "destructive" });
      } else if (isInstitutionalViewer && user.institutionId) {
        const institutionEmployees = EMPLOYEES.filter(e => e.institutionId === user.institutionId);
        setAllEmployeesForUser(institutionEmployees);
        setFilteredEmployees(institutionEmployees);
      } else if (isCommissionUser) {
        setAllEmployeesForUser(EMPLOYEES);
        setFilteredEmployees(EMPLOYEES);
      }
    }
    setPageLoading(false);
  }, [user, role, authLoading, isCommissionUser, isInstitutionalViewer]);
  
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredEmployees(allEmployeesForUser);
      return;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    const filtered = allEmployeesForUser.filter(emp => 
        emp.name.toLowerCase().includes(lowercasedTerm) ||
        emp.zanId.includes(lowercasedTerm) ||
        (emp.cadre && emp.cadre.toLowerCase().includes(lowercasedTerm)) ||
        (emp.institution && emp.institution.toLowerCase().includes(lowercasedTerm))
    );
    setFilteredEmployees(filtered);
  }, [searchTerm, allEmployeesForUser]);


  const pageTitle = useMemo(() => {
    if (role === ROLES.EMPLOYEE) return "My Profile";
    if (isInstitutionalViewer) return `Employee Profiles - ${user?.institutionId || 'Your Institution'}`;
    return "All Employee Profiles";
  }, [role, isInstitutionalViewer, user]);

  const pageDescription = useMemo(() => {
    if (role === ROLES.EMPLOYEE) return "Your comprehensive employee information.";
    if (isInstitutionalViewer) return "A list of all employees within your institution.";
    return "Search and view profiles for all employees across all institutions.";
  }, [role, isInstitutionalViewer]);

  if (authLoading || pageLoading) {
    return (
      <div>
        <PageHeader title="Loading Profile..." />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (selectedEmployee) {
    return <EmployeeDetailsCard emp={selectedEmployee} onBack={() => setSelectedEmployee(null)} />;
  }

  return (
    <div>
      <PageHeader title={pageTitle} description={pageDescription} />
      
      {isCommissionUser && (
        <Card className="mb-6">
            <CardHeader>
                <CardTitle>Search & Filter Employees</CardTitle>
            </CardHeader>
            <CardContent>
                <Input 
                  placeholder="Search by name, ZAN-ID, institution, or rank..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </CardContent>
        </Card>
      )}

      {(isCommissionUser || isInstitutionalViewer) && (
        <Card>
            <CardHeader>
              <CardTitle>Employee List</CardTitle>
              <CardDescription>{filteredEmployees.length} employee(s) found.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableCaption>A list of employees. Click a row to view full details.</TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Gender</TableHead>
                            <TableHead>ZAN-ID</TableHead>
                            <TableHead>Institution</TableHead>
                            <TableHead>Rank</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEmployees.length > 0 ? (
                            filteredEmployees.map(emp => (
                                <TableRow key={emp.id} onClick={() => setSelectedEmployee(emp)} className="cursor-pointer">
                                    <TableCell className="font-medium">{emp.name}</TableCell>
                                    <TableCell>{emp.gender}</TableCell>
                                    <TableCell>{emp.zanId}</TableCell>
                                    <TableCell>{emp.institution || 'N/A'}</TableCell>
                                    <TableCell>{emp.cadre || 'N/A'}</TableCell>
                                    <TableCell>{emp.status || 'N/A'}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center">No employees found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

      {role === ROLES.EMPLOYEE && !selectedEmployee && (
           <Card>
                <CardHeader><CardTitle>Profile Not Found</CardTitle></CardHeader>
                <CardContent><p>Your employee profile could not be loaded. Please contact HR.</p></CardContent>
           </Card>
      )}
    </div>
  );
}
