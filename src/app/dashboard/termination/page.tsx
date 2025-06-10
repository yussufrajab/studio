
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, CalendarDays, Paperclip, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

interface MockPendingTerminationRequest {
  id: string;
  employeeName: string;
  zanId: string;
  reasonSummary: string;
  proposedDate: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
}

const mockPendingTerminationRequests: MockPendingTerminationRequest[] = [
  {
    id: 'TERM001',
    employeeName: 'Ali Juma Ali', // Example
    zanId: '221458232',
    reasonSummary: 'Repeated unauthorized absence and failure to perform duties.',
    proposedDate: '2024-09-01',
    submissionDate: '2024-07-25',
    submittedBy: 'A. Juma (HRO)',
    status: 'Pending DO Review',
  },
  {
    id: 'TERM002',
    employeeName: 'Safia Juma Ali', // Example
    zanId: '125468957',
    reasonSummary: 'Gross misconduct: Violation of code of conduct (details in report).',
    proposedDate: '2024-08-20',
    submissionDate: '2024-07-22',
    submittedBy: 'A. Juma (HRO)',
    status: 'Pending HHRMD Review',
  },
];

export default function TerminationPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reasonTermination, setReasonTermination] = useState('');
  const [proposedDateTermination, setProposedDateTermination] = useState('');
  const [misconductEvidenceFile, setMisconductEvidenceFile] = useState<FileList | null>(null);
  const [supportingDocumentsFile, setSupportingDocumentsFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [minProposedDate, setMinProposedDate] = useState('');

  useEffect(() => {
    setMinProposedDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const resetFormFields = () => {
    setReasonTermination('');
    setProposedDateTermination('');
    setMisconductEvidenceFile(null);
    setSupportingDocumentsFile(null);
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

  const handleSubmitTerminationRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!reasonTermination || !proposedDateTermination || !misconductEvidenceFile || !letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Reason, Proposed Date, Misconduct Evidence, and Letter of Request are required.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";

    if (!checkPdf(misconductEvidenceFile)) {
      toast({ title: "Submission Error", description: "Misconduct Evidence & Investigation Report must be a PDF file.", variant: "destructive" });
      return;
    }
    if (supportingDocumentsFile && !checkPdf(supportingDocumentsFile)) {
      toast({ title: "Submission Error", description: "Supporting Document, if provided, must be a PDF file.", variant: "destructive" });
      return;
    }
    if (!checkPdf(letterOfRequestFile)) {
      toast({ title: "Submission Error", description: "Letter of Request must be a PDF file.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting Termination Request:", {
      employee: employeeDetails,
      reasonTermination,
      proposedDateTermination,
      misconductEvidenceFile: misconductEvidenceFile[0]?.name,
      supportingDocumentsFile: supportingDocumentsFile ? supportingDocumentsFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
      toast({ title: "Termination Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Termination" description="Process employee terminations." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Termination Request</CardTitle>
            <CardDescription>Enter ZanID to fetch employee details, then complete the termination form. All documents must be PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdTermination">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdTermination" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
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
                  <h3 className="text-lg font-medium text-foreground">Termination Details & Documents</h3>
                  <div>
                    <Label htmlFor="reasonTermination">Reason for Termination & Summary of Misconduct</Label>
                    <Textarea id="reasonTermination" placeholder="Clearly state the grounds for termination and summarize evidence" value={reasonTermination} onChange={(e) => setReasonTermination(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="proposedDateTermination" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Proposed Date of Termination</Label>
                    <Input id="proposedDateTermination" type="date" value={proposedDateTermination} onChange={(e) => setProposedDateTermination(e.target.value)} disabled={isSubmitting} min={minProposedDate} />
                  </div>
                  <div>
                    <Label htmlFor="misconductEvidenceFile" className="flex items-center"><ShieldAlert className="mr-2 h-4 w-4 text-destructive" />Upload Misconduct Evidence & Investigation Report (PDF Only)</Label>
                    <Input id="misconductEvidenceFile" type="file" onChange={(e) => setMisconductEvidenceFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="supportingDocumentsFile" className="flex items-center"><Paperclip className="mr-2 h-4 w-4 text-primary" />Upload Supporting Documents (Optional, PDF Only)</Label>
                    <Input id="supportingDocumentsFile" type="file" onChange={(e) => setSupportingDocumentsFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="letterOfRequestFileTermination" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request (PDF Only)</Label>
                    <Input id="letterOfRequestFileTermination" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button 
                onClick={handleSubmitTerminationRequest} 
                disabled={
                    !employeeDetails || 
                    !reasonTermination ||
                    !proposedDateTermination ||
                    !misconductEvidenceFile ||
                    !letterOfRequestFile || 
                    isSubmitting 
                }>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Termination Request
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
      {(role === ROLES.DO || role === ROLES.HHRMD ) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Termination Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending termination requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockPendingTerminationRequests.length > 0 ? (
              mockPendingTerminationRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Termination for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Reason: {request.reasonSummary}</p>
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
              <p className="text-muted-foreground">No termination requests pending review.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
