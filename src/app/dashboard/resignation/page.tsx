
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
import { Loader2, Search, FileText, CalendarDays, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface MockPendingResignationRequest {
  id: string;
  employeeName: string;
  zanId: string;
  effectiveDate: string;
  reason?: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
}

const mockPendingResignationRequests: MockPendingResignationRequest[] = [
  {
    id: 'RESIGN001',
    employeeName: 'Zainab Ali Khamis',
    zanId: '556789345',
    effectiveDate: '2024-09-30',
    reason: 'Relocating to another country.',
    submissionDate: '2024-07-20',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Acknowledgement',
    documents: ['Letter of Request', 'Supporting Document (Visa Copy)'],
  },
  {
    id: 'RESIGN002',
    employeeName: 'Hassan Mzee Juma',
    zanId: '445678912',
    effectiveDate: '2024-08-15',
    reason: 'Pursuing further studies.',
    submissionDate: '2024-07-15',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Acknowledgement',
    documents: ['Letter of Request'],
  },
];


export default function ResignationPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [supportingDocumentFile, setSupportingDocumentFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [minEffectiveDate, setMinEffectiveDate] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<MockPendingResignationRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    setMinEffectiveDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  const resetFormFields = () => {
    setEffectiveDate('');
    setReason('');
    setSupportingDocumentFile(null);
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

  const handleSubmitResignationRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!effectiveDate) {
      toast({ title: "Submission Error", description: "Effective Date of Resignation is required.", variant: "destructive" });
      return;
    }
    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";

    if (!checkPdf(letterOfRequestFile)) {
      toast({ title: "Submission Error", description: "Letter of Request must be a PDF file.", variant: "destructive" });
      return;
    }
    if (supportingDocumentFile && !checkPdf(supportingDocumentFile)) {
      toast({ title: "Submission Error", description: "Supporting Document, if provided, must be a PDF file.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    console.log("Submitting Resignation Request:", {
      employee: employeeDetails,
      effectiveDate,
      reason,
      supportingDocumentFile: supportingDocumentFile ? supportingDocumentFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
      toast({ title: "Resignation Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Resignation" description="Process employee resignations." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Resignation Request</CardTitle>
            <CardDescription>Enter ZanID, then fill resignation details and upload required PDF documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdResignation">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdResignation" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
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
                  <h3 className="text-lg font-medium text-foreground">Resignation Details & Documents</h3>
                  <div>
                    <Label htmlFor="effectiveDate" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Effective Date of Resignation</Label>
                    <Input id="effectiveDate" type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} disabled={isSubmitting} min={minEffectiveDate} />
                  </div>
                  <div>
                    <Label htmlFor="reasonResignation">Reason for Resignation (Optional)</Label>
                    <Textarea id="reasonResignation" placeholder="Optional: Enter reason stated by employee" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="supportingDocumentFile" className="flex items-center"><Paperclip className="mr-2 h-4 w-4 text-primary" />Upload Supporting Document (Optional, PDF Only)</Label>
                    <Input id="supportingDocumentFile" type="file" onChange={(e) => setSupportingDocumentFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="letterOfRequestResignation" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request (Required, PDF Only)</Label>
                    <Input id="letterOfRequestResignation" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button 
                onClick={handleSubmitResignationRequest} 
                disabled={
                    !employeeDetails || 
                    !effectiveDate ||
                    !letterOfRequestFile || 
                    isSubmitting 
                }>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Resignation Request
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
      {(role === ROLES.HHRMD || role === ROLES.HRMO) && ( 
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Resignation Requests</CardTitle>
            <CardDescription>Acknowledge and process resignation requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockPendingResignationRequests.length > 0 ? (
              mockPendingResignationRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Resignation for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Effective Date: {request.effectiveDate}</p>
                  {request.reason && <p className="text-sm text-muted-foreground">Reason: {request.reason}</p>}
                  <p className="text-sm text-muted-foreground">Submitted: {request.submissionDate} by {request.submittedBy}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{request.status}</span></p>
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(request); setIsDetailsModalOpen(true); }}>View Details</Button>
                    <Button size="sm">Acknowledge</Button>
                    <Button size="sm" variant="destructive">Flag Issue</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No resignation requests pending review.</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedRequest && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Request Details: {selectedRequest.id}</DialogTitle>
              <DialogDescription>
                Resignation request for <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                <Label className="text-right font-semibold">Effective Date:</Label>
                <p className="col-span-2">{selectedRequest.effectiveDate}</p>
              </div>
               <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                <Label className="text-right font-semibold pt-1">Reason:</Label>
                <p className="col-span-2">{selectedRequest.reason || 'Not specified'}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                <Label className="text-right font-semibold">Submitted:</Label>
                <p className="col-span-2">{selectedRequest.submissionDate} by {selectedRequest.submittedBy}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                <Label className="text-right font-semibold">Status:</Label>
                <p className="col-span-2 text-primary">{selectedRequest.status}</p>
              </div>
              <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                <Label className="text-right font-semibold pt-1">Documents:</Label>
                 <div className="col-span-2">
                  {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                    <ul className="list-disc pl-5 text-muted-foreground">
                      {selectedRequest.documents.map((doc, index) => <li key={index}>{doc}</li>)}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No documents listed.</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
