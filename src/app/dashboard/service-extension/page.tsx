
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
import { Loader2, Search, FileText, CalendarDays, Paperclip } from 'lucide-react';

export default function ServiceExtensionPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentRetirementDate, setCurrentRetirementDate] = useState('');
  const [requestedExtensionPeriod, setRequestedExtensionPeriod] = useState('');
  const [justification, setJustification] = useState('');
  const [supportingDocumentsFile, setSupportingDocumentsFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  const resetFormFields = () => {
    setCurrentRetirementDate('');
    setRequestedExtensionPeriod('');
    setJustification('');
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

  const handleSubmitServiceExtensionRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!currentRetirementDate || !requestedExtensionPeriod || !justification || !letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Current Retirement Date, Extension Period, Justification, and Letter of Request are required.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";

    if (!checkPdf(letterOfRequestFile)) {
      toast({ title: "Submission Error", description: "Letter of Request must be a PDF file.", variant: "destructive" });
      return;
    }
    if (supportingDocumentsFile && !checkPdf(supportingDocumentsFile)) {
      toast({ title: "Submission Error", description: "Supporting Document, if provided, must be a PDF file.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting Service Extension Request:", {
      employee: employeeDetails,
      currentRetirementDate,
      requestedExtensionPeriod,
      justification,
      supportingDocumentsFile: supportingDocumentsFile ? supportingDocumentsFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
      toast({ title: "Service Extension Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Service Extension" description="Manage employee service extensions." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Service Extension Request</CardTitle>
            <CardDescription>Enter ZanID, then fill extension details and upload required PDF documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdServiceExt">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdServiceExt" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
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
                  <h3 className="text-lg font-medium text-foreground">Service Extension Details & Documents</h3>
                  <div>
                    <Label htmlFor="currentRetirementDate" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Current Retirement Date</Label>
                    <Input id="currentRetirementDate" type="date" value={currentRetirementDate} onChange={(e) => setCurrentRetirementDate(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="requestedExtensionPeriod">Requested Extension Period (e.g., 1 year, 6 months)</Label>
                    <Input id="requestedExtensionPeriod" placeholder="Specify duration of extension" value={requestedExtensionPeriod} onChange={(e) => setRequestedExtensionPeriod(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="justificationServiceExt">Justification for Extension</Label>
                    <Textarea id="justificationServiceExt" placeholder="Provide strong reasons for the service extension" value={justification} onChange={(e) => setJustification(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="supportingDocumentsFile" className="flex items-center"><Paperclip className="mr-2 h-4 w-4 text-primary" />Upload Supporting Documents (Optional, PDF Only)</Label>
                    <Input id="supportingDocumentsFile" type="file" onChange={(e) => setSupportingDocumentsFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="letterOfRequestServiceExt" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request (Required, PDF Only)</Label>
                    <Input id="letterOfRequestServiceExt" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button 
                onClick={handleSubmitServiceExtensionRequest} 
                disabled={
                    !employeeDetails || 
                    !currentRetirementDate ||
                    !requestedExtensionPeriod ||
                    !justification ||
                    !letterOfRequestFile || 
                    isSubmitting 
                }>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Request
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Service Extension Requests</CardTitle>
            <CardDescription>Approve or reject service extension requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No service extension requests pending review.</p>
            {/* Placeholder for actual list of requests */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
