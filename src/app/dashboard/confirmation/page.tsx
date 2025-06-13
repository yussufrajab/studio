
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState } from 'react';
import type { Employee } from '@/lib/types';
import { toast }  from '@/hooks/use-toast';
import { Loader2, Search, FileText, CheckCircle, Award, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format, parseISO } from 'date-fns';

interface MockPendingConfirmationRequest {
  id: string;
  employeeName: string;
  zanId: string;
  department: string;
  cadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
}

const mockPendingConfirmationRequests: MockPendingConfirmationRequest[] = [
  {
    id: 'CONF001',
    employeeName: 'Ali Juma Ali',
    zanId: '221458232',
    department: 'Administration',
    cadre: 'Administrative Officer',
    employmentDate: "2023-01-10",
    dateOfBirth: "1980-05-15",
    institution: "Central Government Office",
    submissionDate: '2024-07-28',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Evaluation Form', 'IPA Certificate', 'Letter of Request'],
  },
];

export default function ConfirmationPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeToConfirm, setEmployeeToConfirm] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  
  const [evaluationFormFile, setEvaluationFormFile] = useState<FileList | null>(null);
  const [ipaCertificateFile, setIpaCertificateFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<MockPendingConfirmationRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const isAlreadyConfirmed = employeeToConfirm?.status === 'Confirmed';

  const resetEmployeeAndForm = () => {
    setEmployeeToConfirm(null); 
    setEvaluationFormFile(null);
    setIpaCertificateFile(null);
    setLetterOfRequestFile(null);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => (input as HTMLInputElement).value = '');
  }

  const handleFetchEmployeeDetails = () => {
    if (!zanId) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID.", variant: "destructive" });
      return;
    }
    setIsFetchingEmployee(true);
    resetEmployeeAndForm();

    setTimeout(() => {
      const foundEmployee = EMPLOYEES.find(emp => emp.zanId === zanId);
      if (foundEmployee) {
        setEmployeeToConfirm(foundEmployee);
        if (foundEmployee.status === 'Confirmed') {
            toast({ 
                title: "Already Confirmed", 
                description: "This employee has already been confirmed. Confirmation request cannot be submitted.", 
                variant: "destructive",
                duration: 5000,
            });
        } else {
            toast({ title: "Employee Found", description: `Details for ${foundEmployee.name} loaded.` });
        }
      } else {
        toast({ title: "Employee Not Found", description: `No employee found with ZanID: ${zanId}.`, variant: "destructive" });
      }
      setIsFetchingEmployee(false);
    }, 1000);
  };

  const handleSubmitRequest = () => {
    if (!employeeToConfirm) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }

    if (employeeToConfirm.status === 'Confirmed') {
      toast({ 
        title: "Already Confirmed", 
        description: "This employee has already been confirmed. Confirmation request cannot be submitted.", 
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!evaluationFormFile) {
      toast({ title: "Submission Error", description: "Evaluation Form is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (!ipaCertificateFile) {
      toast({ title: "Submission Error", description: "IPA Certificate is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    
    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";
    if (!checkPdf(evaluationFormFile) || !checkPdf(ipaCertificateFile) || !checkPdf(letterOfRequestFile)) {
        toast({ title: "Submission Error", description: "All uploaded documents must be in PDF format.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    console.log("Submitting Confirmation Request:", {
      employee: employeeToConfirm,
      evaluationForm: evaluationFormFile[0]?.name,
      ipaCertificate: ipaCertificateFile[0]?.name,
      letterOfRequest: letterOfRequestFile[0]?.name,
    });
    setTimeout(() => {
      toast({ title: "Request Submitted", description: `Confirmation request for ${employeeToConfirm.name} submitted successfully.` });
      setZanId('');
      resetEmployeeAndForm();
      setIsSubmitting(false);
    }, 1500);
  };


  return (
    <div>
      <PageHeader title="Employee Confirmation" description="Manage employee confirmation processes." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Confirmation Request</CardTitle>
            <CardDescription>Enter employee's ZanID to fetch details and upload required PDF documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanId">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanId" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
                <Button onClick={handleFetchEmployeeDetails} disabled={isFetchingEmployee || !zanId || isSubmitting}>
                  {isFetchingEmployee ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Fetch Details
                </Button>
              </div>
            </div>

            {employeeToConfirm && (
              <div className="space-y-6 pt-2">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Employee Details</h3>
                  <div className="p-4 rounded-md border bg-secondary/20 space-y-3 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                      <div><Label className="text-muted-foreground">Name:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.name}</p></div>
                      <div><Label className="text-muted-foreground">ZanID:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.zanId}</p></div>
                      <div><Label className="text-muted-foreground">Payroll Number:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.payrollNumber || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">ZSSF Number:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.zssfNumber || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Department:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.department || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Cadre/Position:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.cadre || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Employment Date:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.employmentDate ? format(parseISO(employeeToConfirm.employmentDate), 'PPP') : 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Date of Birth:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.dateOfBirth ? format(parseISO(employeeToConfirm.dateOfBirth), 'PPP') : 'N/A'}</p></div>
                      <div className="lg:col-span-1"><Label className="text-muted-foreground">Institution:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.institution || 'N/A'}</p></div>
                      <div className="md:col-span-2 lg:col-span-3"><Label className="text-muted-foreground">Current Status:</Label> <p className={`font-semibold ${employeeToConfirm.status === 'Confirmed' ? 'text-green-600' : employeeToConfirm.status === 'On Probation' ? 'text-orange-500' : 'text-foreground'}`}>{employeeToConfirm.status || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>
                
                {isAlreadyConfirmed && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Already Confirmed</AlertTitle>
                    <AlertDescription>
                      This employee has already been confirmed. Confirmation request cannot be submitted.
                    </AlertDescription>
                  </Alert>
                )}
            
                <div className={`space-y-4 ${isAlreadyConfirmed ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <h3 className="text-lg font-medium text-foreground">Required Documents (PDF Only)</h3>
                  <div>
                    <Label htmlFor="evaluationForm" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Evaluation Form</Label>
                    <Input id="evaluationForm" type="file" onChange={(e) => setEvaluationFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting || isAlreadyConfirmed}/>
                  </div>
                  <div>
                    <Label htmlFor="ipaCertificate" className="flex items-center"><Award className="mr-2 h-4 w-4 text-primary" />Upload IPA Certificate</Label>
                    <Input id="ipaCertificate" type="file" onChange={(e) => setIpaCertificateFile(e.target.files)} accept=".pdf" disabled={isSubmitting || isAlreadyConfirmed}/>
                  </div>
                  <div>
                    <Label htmlFor="letterOfRequest" className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                    <Input id="letterOfRequest" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting || isAlreadyConfirmed}/>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeToConfirm && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                <Button 
                    onClick={handleSubmitRequest} 
                    disabled={!employeeToConfirm || !evaluationFormFile || !ipaCertificateFile || !letterOfRequestFile || isSubmitting || isAlreadyConfirmed }>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {(role === ROLES.HHRMD || role === ROLES.HRMO) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Confirmation Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending employee confirmation requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockPendingConfirmationRequests.length > 0 ? (
              mockPendingConfirmationRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Confirmation for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Department: {request.department}</p>
                  <p className="text-sm text-muted-foreground">Submitted: {request.submissionDate} by {request.submittedBy}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{request.status}</span></p>
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(request); setIsDetailsModalOpen(true); }}>View Details</Button>
                    <Button size="sm">Approve</Button>
                    <Button size="sm" variant="destructive">Reject</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No confirmation requests pending review.</p>
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
                Confirmation request for <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
                <div className="space-y-1 border-b pb-3 mb-3">
                    <h4 className="font-semibold text-base text-foreground mb-2">Employee Information</h4>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Full Name:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employeeName}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">ZanID:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.zanId}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Department:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.department}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Cadre/Position:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.cadre}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Employment Date:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employmentDate ? format(parseISO(selectedRequest.employmentDate), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Date of Birth:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.dateOfBirth ? format(parseISO(selectedRequest.dateOfBirth), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Institution:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.institution || 'N/A'}</p>
                    </div>
                </div>

                <div className="space-y-1">
                    <h4 className="font-semibold text-base text-foreground mb-2">Request Information</h4>
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
                            <p className="text-muted-foreground">No documents listed for this mock request.</p>
                        )}
                        </div>
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
    
