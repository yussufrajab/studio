
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
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, isAfter } from 'date-fns';

interface MockPendingConfirmationRequest {
  id: string;
  employeeName: string;
  zanId: string;
  payrollNumber?: string;
  zssfNumber?: string;
  department: string;
  cadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  submissionDate: string;
  decisionDate?: string; // Date of HHRMD/HRMO initial decision (forward/reject)
  commissionDecisionDate?: string; // Date of final commission decision
  submittedBy: string;
  status: string;
  documents?: string[];
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: string;
}

const initialMockPendingConfirmationRequests: MockPendingConfirmationRequest[] = [
  {
    id: 'CONF001',
    employeeName: 'Ali Juma Ali',
    zanId: '221458232',
    payrollNumber: "PAY001",
    zssfNumber: "ZSSF001",
    department: 'Administration',
    cadre: 'Administrative Officer',
    employmentDate: "2023-01-10",
    dateOfBirth: "1980-05-15",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    submissionDate: '2024-07-28',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Evaluation Form', 'IPA Certificate', 'Letter of Request'],
    reviewStage: 'initial',
  },
  {
    id: 'CONF002',
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    payrollNumber: "PAY003",
    zssfNumber: "ZSSF003",
    department: 'Finance',
    cadre: 'Accountant',
    employmentDate: "2022-05-20",
    dateOfBirth: "1988-02-10",
    institution: "Ofisi ya Mhasibu Mkuu wa Serikali",
    submissionDate: '2024-07-20',
    decisionDate: '2024-07-22', // HHRMD forwarded
    commissionDecisionDate: '2024-07-25', // Commission approved
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Approved by Commission',
    documents: ['Evaluation Form', 'IPA Certificate', 'Letter of Request'],
    reviewStage: 'completed',
    reviewedBy: ROLES.HHRMD,
  },
  {
    id: 'CONF003',
    employeeName: 'Hassan Mzee Juma',
    zanId: '445678912',
    payrollNumber: "PAY004",
    zssfNumber: "ZSSF004",
    department: 'ICT',
    cadre: 'IT Support',
    employmentDate: "2011-11-11", // Hired before May 2014
    dateOfBirth: "1975-09-01",
    institution: "WAKALA WA SERIKALI MTANDAO (eGAZ)",
    submissionDate: '2024-07-15',
    decisionDate: '2024-07-18', // HRMO rejected
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Rejected by HRMO - Awaiting HRO Correction',
    documents: ['Evaluation Form', 'Letter of Request'], // No IPA cert needed
    reviewStage: 'initial',
    rejectionReason: 'Incomplete evaluation form.',
    reviewedBy: ROLES.HRMO,
  },
];

export default function ConfirmationPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeToConfirm, setEmployeeToConfirm] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  
  const [evaluationFormFile, setEvaluationFormFile] = useState<FileList | null>(null);
  const [ipaCertificateFile, setIpaCertificateFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIpaRequired, setIsIpaRequired] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<MockPendingConfirmationRequest[]>(initialMockPendingConfirmationRequests);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingConfirmationRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockPendingConfirmationRequest | null>(null);


  const isAlreadyConfirmed = employeeToConfirm?.status === 'Confirmed';

  const resetEmployeeAndForm = () => {
    setEmployeeToConfirm(null); 
    setEvaluationFormFile(null);
    setIpaCertificateFile(null);
    setLetterOfRequestFile(null);
    setIsIpaRequired(false);
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

        if (foundEmployee.employmentDate) {
            try {
                const employmentDate = parseISO(foundEmployee.employmentDate);
                const cutoffDate = new Date('2014-05-01');
                if (isAfter(employmentDate, cutoffDate)) {
                    setIsIpaRequired(true);
                }
            } catch (error) {
                console.error("Error parsing employment date:", error);
                toast({ title: "Date Error", description: "Could not parse employee's employment date.", variant: "destructive" });
            }
        }

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
    if (isIpaRequired && !ipaCertificateFile) {
      toast({ title: "Submission Error", description: "IPA Certificate is missing for this employee. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    
    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";
    if (!checkPdf(evaluationFormFile)) {
        toast({ title: "Submission Error", description: "Evaluation Form must be a PDF.", variant: "destructive" });
        return;
    }
    if (isIpaRequired && !checkPdf(ipaCertificateFile)) {
        toast({ title: "Submission Error", description: "IPA Certificate must be a PDF.", variant: "destructive" });
        return;
    }
    if (!checkPdf(letterOfRequestFile)) {
        toast({ title: "Submission Error", description: "Letter of Request must be a PDF.", variant: "destructive" });
        return;
    }


    setIsSubmitting(true);
    const newRequestId = `CONF${Date.now().toString().slice(-3)}`;
    
    const documentsList = ['Evaluation Form', 'Letter of Request'];
    if (isIpaRequired) {
      documentsList.push('IPA Certificate');
    }

    const newRequest: MockPendingConfirmationRequest = {
        id: newRequestId,
        employeeName: employeeToConfirm.name,
        zanId: employeeToConfirm.zanId,
        payrollNumber: employeeToConfirm.payrollNumber,
        zssfNumber: employeeToConfirm.zssfNumber,
        department: employeeToConfirm.department || 'N/A',
        cadre: employeeToConfirm.cadre || 'N/A',
        employmentDate: employeeToConfirm.employmentDate || 'N/A',
        dateOfBirth: employeeToConfirm.dateOfBirth || 'N/A',
        institution: employeeToConfirm.institution || 'N/A',
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        submittedBy: `${user?.name} (${user?.role})`,
        status: role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending HRMO Review',
        documents: documentsList,
        reviewStage: 'initial',
    };
    
    console.log("Submitting Confirmation Request:", newRequest);

    setTimeout(() => {
      setPendingRequests(prev => [newRequest, ...prev]);
      toast({ title: "Request Submitted", description: `Confirmation request for ${employeeToConfirm.name} submitted successfully.` });
      setZanId('');
      resetEmployeeAndForm();
      setIsSubmitting(false);
    }, 1500);
  };

  const handleInitialAction = (requestId: string, action: 'forward' | 'reject') => {
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) return;

    const currentDate = format(new Date(), 'yyyy-MM-dd');

    if (action === 'reject') {
      setCurrentRequestToAction(request);
      setRejectionReasonInput('');
      setIsRejectionModalOpen(true);
    } else if (action === 'forward') {
      setPendingRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId
            ? { ...req, status: "Request Received – Awaiting Commission Decision", reviewStage: 'commission_review', reviewedBy: role || undefined, decisionDate: currentDate }
            : req
        )
      );
      toast({ title: "Request Forwarded", description: `Request ${requestId} for ${request.employeeName} forwarded to Commission.` });
    }
  };

  const handleRejectionSubmit = () => {
    if (!currentRequestToAction || !rejectionReasonInput.trim()) {
      toast({ title: "Rejection Error", description: "Reason for rejection is required.", variant: "destructive" });
      return;
    }
    const requestId = currentRequestToAction.id;
    const employeeName = currentRequestToAction.employeeName;
    const currentDate = format(new Date(), 'yyyy-MM-dd');

    setPendingRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId
          ? { ...req, status: `Rejected by ${role} - Awaiting HRO Correction`, rejectionReason: rejectionReasonInput, reviewStage: 'initial', decisionDate: currentDate }
          : req
      )
    );
    toast({ title: "Request Rejected", description: `Request ${requestId} for ${employeeName} rejected and returned to HRO.`, variant: 'destructive' });
    setIsRejectionModalOpen(false);
    setCurrentRequestToAction(null);
    setRejectionReasonInput('');
  };

  const handleCommissionDecision = (requestId: string, decision: 'approved' | 'rejected') => {
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) return;

    const finalStatus = decision === 'approved' ? "Approved by Commission" : "Rejected by Commission";
    const currentDate = format(new Date(), 'yyyy-MM-dd');
    setPendingRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId
          ? { ...req, status: finalStatus, reviewStage: 'completed', commissionDecisionDate: currentDate, decisionDate: req.decisionDate || currentDate } // decisionDate might have been set at forwarding
          : req
      )
    );
    toast({ title: `Commission Decision: ${decision === 'approved' ? 'Approved' : 'Rejected'}`, description: `Request ${requestId} for ${request.employeeName} has been ${finalStatus.toLowerCase()}.` });
  };

  const isSubmitDisabled = !employeeToConfirm || !evaluationFormFile || (isIpaRequired && !ipaCertificateFile) || !letterOfRequestFile || isSubmitting || isAlreadyConfirmed;

  return (
    <div>
      <PageHeader title="Employee Confirmation" description="Manage employee confirmation processes." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Confirmation Request</CardTitle>
            <CardDescription>Enter employee's ZanID to fetch details. Required documents will be determined by hiring date.</CardDescription>
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
                  {isIpaRequired && (
                    <p className="text-sm text-muted-foreground -mt-3 mb-2">
                     IPA Certificate is required for this employee (hired from May 2014 onwards).
                    </p>
                  )}
                  <div>
                    <Label htmlFor="evaluationForm" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Evaluation Form</Label>
                    <Input id="evaluationForm" type="file" onChange={(e) => setEvaluationFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting || isAlreadyConfirmed}/>
                  </div>
                  {isIpaRequired && (
                    <div>
                        <Label htmlFor="ipaCertificate" className="flex items-center"><Award className="mr-2 h-4 w-4 text-primary" />Upload IPA Certificate</Label>
                        <Input id="ipaCertificate" type="file" onChange={(e) => setIpaCertificateFile(e.target.files)} accept=".pdf" disabled={isSubmitting || isAlreadyConfirmed}/>
                    </div>
                  )}
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
                    disabled={isSubmitDisabled}>
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
            {pendingRequests.filter(req => 
                (role === ROLES.HHRMD && req.status === 'Pending HHRMD Review') ||
                (role === ROLES.HRMO && req.status === 'Pending HRMO Review') ||
                req.status === 'Request Received – Awaiting Commission Decision' ||
                req.status.startsWith('Rejected by') || req.status.startsWith('Approved by Commission') || req.status.startsWith('Rejected by Commission')
            ).length > 0 ? (
              pendingRequests.filter(req => 
                (role === ROLES.HHRMD && req.status === 'Pending HHRMD Review') ||
                (role === ROLES.HRMO && req.status === 'Pending HRMO Review') ||
                req.status === 'Request Received – Awaiting Commission Decision' ||
                req.status.startsWith('Rejected by') || req.status.startsWith('Approved by Commission') || req.status.startsWith('Rejected by Commission')
              ).map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Confirmation for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Department: {request.department}</p>
                  <p className="text-sm text-muted-foreground">Submitted: {request.submissionDate ? format(parseISO(request.submissionDate), 'PPP') : 'N/A'} by {request.submittedBy}</p>
                  {request.decisionDate && <p className="text-sm text-muted-foreground">Initial Review Date: {format(parseISO(request.decisionDate), 'PPP')}</p>}
                  {request.commissionDecisionDate && <p className="text-sm text-muted-foreground">Commission Decision Date: {format(parseISO(request.commissionDecisionDate), 'PPP')}</p>}
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{request.status}</span></p>
                  {request.rejectionReason && <p className="text-sm text-destructive"><span className="font-medium">Rejection Reason:</span> {request.rejectionReason}</p>}
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(request); setIsDetailsModalOpen(true); }}>View Details</Button>
                     {request.reviewStage === 'initial' && (request.status.startsWith(`Pending ${role} Review`)) && (
                      <>
                        <Button size="sm" onClick={() => handleInitialAction(request.id, 'forward')}>Verify &amp; Forward to Commission</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleInitialAction(request.id, 'reject')}>Reject &amp; Return to HRO</Button>
                      </>
                    )}
                    {request.reviewStage === 'commission_review' && request.status === 'Request Received – Awaiting Commission Decision' && request.reviewedBy === role && (
                        <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleCommissionDecision(request.id, 'approved')}>Approved by Commission</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleCommissionDecision(request.id, 'rejected')}>Rejected by Commission</Button>
                        </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No confirmation requests pending your review.</p>
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
            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto">
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
                        <Label className="text-right text-muted-foreground">Payroll #:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.payrollNumber || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">ZSSF #:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.zssfNumber || 'N/A'}</p>
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
                        <p className="col-span-2">{selectedRequest.submissionDate ? format(parseISO(selectedRequest.submissionDate), 'PPP') : 'N/A'} by {selectedRequest.submittedBy}</p>
                    </div>
                     {selectedRequest.decisionDate && (
                       <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                            <Label className="text-right font-semibold">Initial Review Date:</Label>
                            <p className="col-span-2">{format(parseISO(selectedRequest.decisionDate), 'PPP')}</p>
                        </div>
                    )}
                    {selectedRequest.commissionDecisionDate && (
                       <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                            <Label className="text-right font-semibold">Commission Decision Date:</Label>
                            <p className="col-span-2">{format(parseISO(selectedRequest.commissionDecisionDate), 'PPP')}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Status:</Label>
                        <p className="col-span-2 text-primary">{selectedRequest.status}</p>
                    </div>
                    {selectedRequest.rejectionReason && (
                        <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                            <Label className="text-right font-semibold text-destructive pt-1">Rejection Reason:</Label>
                            <p className="col-span-2 text-destructive">{selectedRequest.rejectionReason}</p>
                        </div>
                    )}
                </div>
                 <div className="pt-3 mt-3 border-t">
                    <Label className="font-semibold">Attached Documents</Label>
                    <div className="mt-2 space-y-2">
                    {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                        selectedRequest.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-secondary/50 text-sm">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-foreground truncate" title={doc}>{doc}</span>
                                </div>
                                <Button asChild variant="link" size="sm" className="h-auto p-0 flex-shrink-0">
                                    <a href="#" onClick={(e) => e.preventDefault()} target="_blank" rel="noopener noreferrer">View Document</a>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">No documents were attached to this request.</p>
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

      {currentRequestToAction && (
        <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reject Confirmation Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the confirmation request for <strong>{currentRequestToAction.employeeName}</strong>. This reason will be visible to the HRO.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Enter rejection reason here..."
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        rows={4}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsRejectionModalOpen(false); setCurrentRequestToAction(null); }}>Cancel</Button>
                    <Button variant="destructive" onClick={handleRejectionSubmit} disabled={!rejectionReasonInput.trim()}>Submit Rejection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
    

    
