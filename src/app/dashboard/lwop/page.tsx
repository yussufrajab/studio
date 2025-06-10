
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText } from 'lucide-react';

interface MockPendingLWOPRequest {
  id: string;
  employeeName: string;
  zanId: string;
  duration: string;
  reason: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
}

const mockPendingLWOPRequests: MockPendingLWOPRequest[] = [
  {
    id: 'LWOP001',
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    duration: '6 Months',
    reason: 'Further studies abroad.',
    submissionDate: '2024-07-25',
    submittedBy: 'A. Juma (HRO)',
    status: 'Pending HHRMD Review',
  },
  {
    id: 'LWOP002',
    employeeName: 'Hassan Mzee Juma',
    zanId: '445678912',
    duration: '1 Year',
    reason: 'Personal family matters requiring extended leave.',
    submissionDate: '2024-07-22',
    submittedBy: 'A. Juma (HRO)',
    status: 'Pending DO Review',
  },
];

export default function LwopPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  const handleFetchEmployeeDetails = () => {
    if (!zanId) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID.", variant: "destructive" });
      return;
    }
    setIsFetchingEmployee(true);
    setEmployeeDetails(null);
    // Reset form fields when fetching new employee
    setDuration('');
    setReason('');
    setLetterOfRequestFile(null);
    const fileInput = document.getElementById('letterOfRequestLwop') as HTMLInputElement;
    if (fileInput) fileInput.value = '';


    setTimeout(() => {
      const foundEmployee = EMPLOYEES.find(emp => emp.zanId === zanId);
      if (foundEmployee) {
        setEmployeeDetails(foundEmployee);
        toast({ title: "Employee Found", description: `Details for ${foundEmployee.name} loaded.` });
      } else {
        toast({ title: "Employee Not Found", description: `No employee found with ZanID: ${zanId}.`, variant: "destructive" });
      }
      setIsFetchingEmployee(false);
    }, 1000);
  };

  const handleSubmitLwopRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!duration || !reason || !letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Please fill all fields and upload the letter of request (PDF only).", variant: "destructive" });
      return;
    }
    if (letterOfRequestFile && letterOfRequestFile[0] && letterOfRequestFile[0].type !== "application/pdf") {
        toast({ title: "Submission Error", description: "The letter of request must be a PDF file.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    console.log("Submitting LWOP Request:", {
      employee: employeeDetails,
      duration,
      reason,
      letterOfRequest: letterOfRequestFile[0]?.name,
    });
    setTimeout(() => {
      toast({ title: "LWOP Request Submitted", description: `LWOP request for ${employeeDetails.name} submitted successfully.` });
      // Reset all fields
      setZanId('');
      setEmployeeDetails(null);
      setDuration('');
      setReason('');
      setLetterOfRequestFile(null);
      const fileInput = document.getElementById('letterOfRequestLwop') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Leave Without Pay (LWOP)" description="Manage LWOP requests." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit LWOP Request</CardTitle>
            <CardDescription>Enter employee's ZanID to fetch details, then complete the LWOP form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdLwop">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdLwop" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
                <Button onClick={handleFetchEmployeeDetails} disabled={isFetchingEmployee || !zanId || isSubmitting}>
                  {isFetchingEmployee ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Fetch Details
                </Button>
              </div>
            </div>

            {employeeDetails && (
              <div className="space-y-6 pt-2">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Employee Details</h3>
                  <div className="p-4 rounded-md border bg-secondary/20 space-y-3 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div><Label className="text-muted-foreground">Name:</Label> <p className="font-semibold text-foreground">{employeeDetails.name}</p></div>
                      <div><Label className="text-muted-foreground">ZanID:</Label> <p className="font-semibold text-foreground">{employeeDetails.zanId}</p></div>
                      <div><Label className="text-muted-foreground">Department:</Label> <p className="font-semibold text-foreground">{employeeDetails.department || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Cadre/Position:</Label> <p className="font-semibold text-foreground">{employeeDetails.cadre || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>
            
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">LWOP Details</h3>
                  <div>
                    <Label htmlFor="durationLwop">Duration (e.g., 3 months, 2024-01-01 to 2024-03-31)</Label>
                    <Input id="durationLwop" placeholder="Specify duration and dates" value={duration} onChange={(e) => setDuration(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="reasonLwop">Reason for LWOP</Label>
                    <Textarea id="reasonLwop" placeholder="State the reason for the leave request" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="letterOfRequestLwop" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request (PDF Only)</Label>
                    <Input id="letterOfRequestLwop" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting} />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                <Button onClick={handleSubmitLwopRequest} disabled={!employeeDetails || !duration || !reason || !letterOfRequestFile || isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit LWOP Request
                </Button>
            </CardFooter>
          )}
        </Card>
      )}

       {(role === ROLES.HHRMD || role === ROLES.HRMO || role === ROLES.DO) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review LWOP Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending LWOP requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockPendingLWOPRequests.length > 0 ? (
              mockPendingLWOPRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">LWOP Request for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Duration: {request.duration}</p>
                  <p className="text-sm text-muted-foreground">Reason: {request.reason}</p>
                  <p className="text-sm text-muted-foreground">Submitted: {request.submissionDate} by {request.submittedBy}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{request.status}</span></p>
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="destructive">Reject</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No LWOP requests pending review.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
