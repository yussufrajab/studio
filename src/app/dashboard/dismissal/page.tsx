
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
import { Loader2, Search, FileText, CalendarDays, Paperclip, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

export default function DismissalPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [reasonDismissal, setReasonDismissal] = useState('');
  const [proposedDateDismissal, setProposedDateDismissal] = useState('');
  const [appraisalFormFile, setAppraisalFormFile] = useState<FileList | null>(null);
  const [supportingDocumentsFile, setSupportingDocumentsFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [minProposedDate, setMinProposedDate] = useState('');

  useEffect(() => {
    setMinProposedDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const isDismissalAllowed = employeeDetails && employeeDetails.status === 'On Probation';

  const resetFormFields = () => {
    setReasonDismissal('');
    setProposedDateDismissal('');
    setAppraisalFormFile(null);
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
        if (foundEmployee.status !== 'On Probation') {
          toast({
            title: "Dismissal Not Applicable",
            description: `Dismissal is for 'On Probation' employees. This employee is ${foundEmployee.status}.`,
            variant: "warning",
            duration: 5000,
          });
        }
      } else {
        toast({ title: "Employee Not Found", description: `No employee found with ZanID: ${zanId}.`, variant: "destructive" });
      }
      setIsFetchingEmployee(false);
    }, 1000);
  };

  const handleSubmitDismissalRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!isDismissalAllowed) {
      toast({ title: "Submission Error", description: "Dismissal is only applicable to employees 'On Probation'.", variant: "destructive" });
      return;
    }
    if (!reasonDismissal || !proposedDateDismissal || !letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Reason, Proposed Date, and Letter of Request are required.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => !fileList || (fileList[0] && fileList[0].type === "application/pdf");

    if (!checkPdf(appraisalFormFile)) {
      toast({ title: "Submission Error", description: "Appraisal Form must be a PDF file.", variant: "destructive" });
      return;
    }
    if (!checkPdf(supportingDocumentsFile)) {
      toast({ title: "Submission Error", description: "Supporting Document, if provided, must be a PDF file.", variant: "destructive" });
      return;
    }
    if (letterOfRequestFile && letterOfRequestFile[0].type !== "application/pdf") {
      toast({ title: "Submission Error", description: "Letter of Request must be a PDF file.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting Dismissal Request:", {
      employee: employeeDetails,
      reasonDismissal,
      proposedDateDismissal,
      appraisalFormFile: appraisalFormFile ? appraisalFormFile[0]?.name : null,
      supportingDocumentsFile: supportingDocumentsFile ? supportingDocumentsFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
      toast({ title: "Dismissal Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Dismissal" description="Process employee dismissals for unconfirmed employees." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Dismissal Request</CardTitle>
            <CardDescription>Enter ZanID to fetch employee details, then complete the dismissal form. All documents must be PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdDismissal">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdDismissal" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
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
                      <div><Label className="text-muted-foreground">Status:</Label> <p className={`font-semibold ${isDismissalAllowed ? 'text-green-600' : 'text-red-600'}`}>{employeeDetails.status || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>

                {!isDismissalAllowed && (
                  <div className="flex items-center p-4 mt-4 text-sm text-destructive border border-destructive/50 rounded-md bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 mr-3" />
                    <span>Dismissal is only applicable to employees 'On Probation'. This employee is {employeeDetails.status}.</span>
                  </div>
                )}

                <div className={`space-y-4 ${!isDismissalAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <h3 className="text-lg font-medium text-foreground">Dismissal Details & Documents</h3>
                  <div>
                    <Label htmlFor="reasonDismissal">Reason for Dismissal</Label>
                    <Textarea id="reasonDismissal" placeholder="Clearly state the grounds for dismissal" value={reasonDismissal} onChange={(e) => setReasonDismissal(e.target.value)} disabled={!isDismissalAllowed || isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="proposedDateDismissal" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Proposed Date of Dismissal</Label>
                    <Input id="proposedDateDismissal" type="date" value={proposedDateDismissal} onChange={(e) => setProposedDateDismissal(e.target.value)} disabled={!isDismissalAllowed || isSubmitting} min={minProposedDate} />
                  </div>
                  <div>
                    <Label htmlFor="appraisalFormFile" className="flex items-center"><ClipboardCheck className="mr-2 h-4 w-4 text-primary" />Upload Form for Appraisal (Optional, PDF Only)</Label>
                    <Input id="appraisalFormFile" type="file" onChange={(e) => setAppraisalFormFile(e.target.files)} accept=".pdf" disabled={!isDismissalAllowed || isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="supportingDocumentsFile" className="flex items-center"><Paperclip className="mr-2 h-4 w-4 text-primary" />Upload Supporting Documents (Optional, PDF Only)</Label>
                    <Input id="supportingDocumentsFile" type="file" onChange={(e) => setSupportingDocumentsFile(e.target.files)} accept=".pdf" disabled={!isDismissalAllowed || isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="letterOfRequestFileDismissal" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request (Required, PDF Only)</Label>
                    <Input id="letterOfRequestFileDismissal" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={!isDismissalAllowed || isSubmitting}/>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button
                onClick={handleSubmitDismissalRequest}
                disabled={
                    !employeeDetails ||
                    !isDismissalAllowed ||
                    !reasonDismissal ||
                    !proposedDateDismissal ||
                    !letterOfRequestFile ||
                    isSubmitting
                }>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Dismissal Request
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
      {(role === ROLES.DO || role === ROLES.HHRMD_HRMO ) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Dismissal Requests</CardTitle>
            <CardDescription>Approve or reject dismissal requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No dismissal requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


    