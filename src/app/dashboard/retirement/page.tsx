
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, CalendarDays, ListFilter, Stethoscope, ClipboardCheck } from 'lucide-react';
import { addMonths, format, isBefore } from 'date-fns';

interface MockPendingRetirementRequest {
  id: string;
  employeeName: string;
  zanId: string;
  retirementType: string;
  proposedDate: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
}

const mockPendingRetirementRequests: MockPendingRetirementRequest[] = [
  {
    id: 'RETIRE001',
    employeeName: 'Hamid Khalfan Abdalla', // Assuming he is nearing retirement based on mock data
    zanId: '778901234',
    retirementType: 'Compulsory (Age 60)',
    proposedDate: '2025-03-25',
    submissionDate: '2024-07-30',
    submittedBy: 'A. Juma (HRO)',
    status: 'Pending HHRMD Review',
  },
  {
    id: 'RETIRE002',
    employeeName: 'Juma Omar Ali', // Assuming voluntary retirement
    zanId: '667890456',
    retirementType: 'Voluntary (Age 55+)',
    proposedDate: '2025-06-18',
    submissionDate: '2024-07-28',
    submittedBy: 'A. Juma (HRO)',
    status: 'Pending DO Review',
  },
];


export default function RetirementPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [retirementType, setRetirementType] = useState('');
  const [retirementDate, setRetirementDate] = useState('');
  const [medicalFormFile, setMedicalFormFile] = useState<FileList | null>(null);
  const [illnessLeaveLetterFile, setIllnessLeaveLetterFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [minRetirementDate, setMinRetirementDate] = useState('');

  useEffect(() => {
    // Set min retirement date to 6 months from today
    const sixMonthsFromNow = addMonths(new Date(), 6);
    setMinRetirementDate(format(sixMonthsFromNow, 'yyyy-MM-dd'));
  }, []);

  const resetFormFields = () => {
    setRetirementType('');
    setRetirementDate('');
    setMedicalFormFile(null);
    setIllnessLeaveLetterFile(null);
    setLetterOfRequestFile(null);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => (input as HTMLInputElement).value = '');
  };

  const handleFetchEmployeeDetails = () => {
    if (!zanId) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID.", variant: "destructive" });
      return;
    }
    setIsFetchingEmployee(true);
    setEmployeeDetails(null);
    resetFormFields();

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

  const handleSubmitRetirementRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!retirementType || !retirementDate || !letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Retirement Type, Proposed Date, and Letter of Request are required.", variant: "destructive" });
      return;
    }

    const proposedDate = new Date(retirementDate + "T00:00:00"); // Ensure it's start of day for comparison
    const sixMonthsFromToday = addMonths(new Date(), 6);
    sixMonthsFromToday.setHours(0, 0, 0, 0); // Normalize to start of day

    if (isBefore(proposedDate, sixMonthsFromToday)) {
      toast({ title: "Submission Error", description: "Proposed retirement date must be at least 6 months from today.", variant: "destructive" });
      return;
    }

    if (retirementType === 'illness' && (!medicalFormFile || !illnessLeaveLetterFile)) {
      toast({ title: "Submission Error", description: "Medical Form and Leave Due to Illness Letter are required for retirement due to illness.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";

    if (!checkPdf(letterOfRequestFile)) {
      toast({ title: "Submission Error", description: "Letter of Request must be a PDF file.", variant: "destructive" });
      return;
    }
    if (retirementType === 'illness') {
      if (medicalFormFile && !checkPdf(medicalFormFile)) {
        toast({ title: "Submission Error", description: "Medical Form must be a PDF file.", variant: "destructive" });
        return;
      }
      if (illnessLeaveLetterFile && !checkPdf(illnessLeaveLetterFile)) {
        toast({ title: "Submission Error", description: "Leave Due to Illness Letter must be a PDF file.", variant: "destructive" });
        return;
      }
    }
    

    setIsSubmitting(true);
    console.log("Submitting Retirement Request:", {
      employee: employeeDetails,
      retirementType,
      retirementDate,
      medicalFormFile: medicalFormFile ? medicalFormFile[0]?.name : null,
      illnessLeaveLetterFile: illnessLeaveLetterFile ? illnessLeaveLetterFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
      toast({ title: "Retirement Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Retirement" description="Manage employee retirement processes." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Retirement Request</CardTitle>
            <CardDescription>Enter ZanID, then fill retirement details and upload required PDF documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdRetirement">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdRetirement" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
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
                      <div><Label className="text-muted-foreground">Cadre:</Label> <p className="font-semibold text-foreground">{employeeDetails.cadre || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Retirement Details & Documents (PDF Only)</h3>
                  <div>
                    <Label htmlFor="retirementType" className="flex items-center"><ListFilter className="mr-2 h-4 w-4 text-primary" />Retirement Type</Label>
                    <Select value={retirementType} onValueChange={setRetirementType} disabled={isSubmitting}>
                      <SelectTrigger id="retirementTypeTrigger">
                        <SelectValue placeholder="Select retirement type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compulsory">Compulsory (Age 60)</SelectItem>
                        <SelectItem value="voluntary">Voluntary (Age 55+)</SelectItem>
                        <SelectItem value="illness">Illness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="retirementDate" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Proposed Retirement Date</Label>
                    <Input id="retirementDate" type="date" value={retirementDate} onChange={(e) => setRetirementDate(e.target.value)} disabled={isSubmitting} min={minRetirementDate} />
                  </div>
                  
                  {retirementType === 'illness' && (
                    <>
                      <div>
                        <Label htmlFor="medicalFormFile" className="flex items-center"><Stethoscope className="mr-2 h-4 w-4 text-primary" />Upload Medical Form</Label>
                        <Input id="medicalFormFile" type="file" onChange={(e) => setMedicalFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                      </div>
                      <div>
                        <Label htmlFor="illnessLeaveLetterFile" className="flex items-center"><ClipboardCheck className="mr-2 h-4 w-4 text-primary" />Upload Leave Due to Illness Letter</Label>
                        <Input id="illnessLeaveLetterFile" type="file" onChange={(e) => setIllnessLeaveLetterFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="letterOfRequestRetirement" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                    <Input id="letterOfRequestRetirement" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                   <p className="text-xs text-muted-foreground">
                    Note: Proposed retirement date must be at least 6 months from today. For Compulsory retirement, employee must be 60 years old. For Voluntary, 55 years. Age validation based on Date of Birth is typically performed server-side.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button 
                onClick={handleSubmitRetirementRequest} 
                disabled={
                    !employeeDetails || 
                    !retirementType || 
                    !retirementDate || 
                    !letterOfRequestFile || 
                    (retirementType === 'illness' && (!medicalFormFile || !illnessLeaveLetterFile)) || 
                    isSubmitting 
                }>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Retirement Request
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
      {(role === ROLES.HHRMD || role === ROLES.HRMO || role === ROLES.DO) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Retirement Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending retirement requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockPendingRetirementRequests.length > 0 ? (
              mockPendingRetirementRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Retirement Request for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Type: {request.retirementType}</p>
                  <p className="text-sm text-muted-foreground">Proposed Date: {request.proposedDate}</p>
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
              <p className="text-muted-foreground">No retirement requests pending review.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
