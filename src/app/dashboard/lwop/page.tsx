
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
import { Loader2, Search, FileText, AlertTriangle, CheckSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';

interface MockPendingLWOPRequest {
  id: string;
  employeeName: string;
  zanId: string;
  department: string;
  cadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  duration: string;
  reason: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: string;
}

const initialMockPendingLWOPRequests: MockPendingLWOPRequest[] = [
  {
    id: 'LWOP001',
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    department: 'Finance',
    cadre: 'Accountant',
    employmentDate: "2018-09-15",
    dateOfBirth: "1988-02-10",
    institution: "Treasury Office",
    duration: '6 Months',
    reason: 'Further studies abroad.',
    submissionDate: '2024-07-25',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Letter of Request', 'Employee Consent Letter', 'Admission Letter Scan'],
    reviewStage: 'initial',
  },
  {
    id: 'LWOP002',
    employeeName: 'Hassan Mzee Juma',
    zanId: '445678912',
    department: 'ICT',
    cadre: 'IT Support',
    employmentDate: "2017-01-20",
    dateOfBirth: "1975-09-01",
    institution: "e-Government Agency",
    duration: '1 Year',
    reason: 'Personal family matters requiring extended leave.',
    submissionDate: '2024-07-22',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    documents: ['Letter of Request', 'Employee Consent Letter'],
    reviewStage: 'initial',
  },
];

function parseDurationToMonths(durationStr: string): number | null {
  durationStr = durationStr.toLowerCase().trim();

  const monthsMatch = durationStr.match(/^(\d+)\s*months?$/);
  if (monthsMatch && monthsMatch[1]) {
    return parseInt(monthsMatch[1], 10);
  }

  const yearsMatch = durationStr.match(/^(\d+)\s*years?$/);
  if (yearsMatch && yearsMatch[1]) {
    return parseInt(yearsMatch[1], 10) * 12;
  }
  
  const numberMatch = durationStr.match(/^(\d+)$/);
  if (numberMatch && numberMatch[1]) {
    return parseInt(numberMatch[1], 10);
  }

  return null; 
}


export default function LwopPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [duration, setDuration] = useState('');
  const [reason, setReason] = useState('');
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [employeeConsentLetterFile, setEmployeeConsentLetterFile] = useState<FileList | null>(null);

  const [pendingRequests, setPendingRequests] = useState<MockPendingLWOPRequest[]>(initialMockPendingLWOPRequests);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingLWOPRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockPendingLWOPRequest | null>(null);

  const isEmployeeOnProbation = employeeDetails?.status === 'On Probation';

  const handleFetchEmployeeDetails = () => {
    if (!zanId) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID.", variant: "destructive" });
      return;
    }
    setIsFetchingEmployee(true);
    setEmployeeDetails(null);
    setDuration('');
    setReason('');
    setLetterOfRequestFile(null);
    setEmployeeConsentLetterFile(null);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => (input as HTMLInputElement).value = '');


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

    if (employeeDetails.status === 'On Probation') {
      toast({ 
        title: "LWOP Not Applicable", 
        description: "This employee is currently 'On Probation' and cannot apply for LWOP.", 
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (!duration) {
      toast({ title: "Submission Error", description: "Duration is missing. Please fill in the duration.", variant: "destructive" });
      return;
    }
    if (!reason) {
      toast({ title: "Submission Error", description: "Reason for LWOP is missing. Please fill in the reason.", variant: "destructive" });
      return;
    }
    
    const parsedMonths = parseDurationToMonths(duration);
    if (parsedMonths === null) {
      toast({ 
        title: "Invalid Duration Format", 
        description: "Please enter duration like '6 months', '1 year', or a number of months (e.g., '24').", 
        variant: "destructive",
        duration: 5000,
      });
      return;
    }

    if (parsedMonths > 36) {
      toast({ 
        title: "LWOP Duration Exceeded", 
        description: "Maximum LWOP duration is 36 months.", 
        variant: "destructive",
        duration: 5000,
      });
      return;
    }
    
    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (letterOfRequestFile && letterOfRequestFile[0] && letterOfRequestFile[0].type !== "application/pdf") {
        toast({ title: "Submission Error", description: "The Letter of Request must be a PDF file.", variant: "destructive" });
        return;
    }
    if (!employeeConsentLetterFile) {
      toast({ title: "Submission Error", description: "Employee's Consent Letter is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (employeeConsentLetterFile && employeeConsentLetterFile[0] && employeeConsentLetterFile[0].type !== "application/pdf") {
      toast({ title: "Submission Error", description: "The Employee's Consent Letter must be a PDF file.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
     const newRequestId = `LWOP${Date.now().toString().slice(-3)}`;
    const newRequest: MockPendingLWOPRequest = {
        id: newRequestId,
        employeeName: employeeDetails.name,
        zanId: employeeDetails.zanId,
        department: employeeDetails.department || 'N/A',
        cadre: employeeDetails.cadre || 'N/A',
        employmentDate: employeeDetails.employmentDate || 'N/A',
        dateOfBirth: employeeDetails.dateOfBirth || 'N/A',
        institution: employeeDetails.institution || 'N/A',
        duration: duration,
        reason: reason,
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        submittedBy: `${user?.name} (${user?.role})`,
        status: role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending HRMO Review', 
        documents: ['Letter of Request', 'Employee Consent Letter'],
        reviewStage: 'initial',
    };
    console.log("Submitting LWOP Request:", {
      employee: employeeDetails,
      duration,
      parsedMonths,
      reason,
      letterOfRequest: letterOfRequestFile[0]?.name,
      employeeConsentLetter: employeeConsentLetterFile[0]?.name,
    });
    setTimeout(() => {
      setPendingRequests(prev => [newRequest, ...prev]);
      toast({ title: "LWOP Request Submitted", description: `LWOP request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      setDuration('');
      setReason('');
      setLetterOfRequestFile(null);
      setEmployeeConsentLetterFile(null);
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => (input as HTMLInputElement).value = '');
      setIsSubmitting(false);
    }, 1500);
  };
  
  const handleInitialAction = (requestId: string, action: 'forward' | 'reject') => {
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) return;

    if (action === 'reject') {
      setCurrentRequestToAction(request);
      setRejectionReasonInput('');
      setIsRejectionModalOpen(true);
    } else if (action === 'forward') {
      let toastMessage = "";
      setPendingRequests(prevRequests =>
        prevRequests.map(req => {
          if (req.id === requestId) {
            toastMessage = `Request ${requestId} for ${req.employeeName} forwarded to Commission.`;
            return { ...req, status: "Request Received – Awaiting Commission Decision", reviewStage: 'commission_review', reviewedBy: role || undefined };
          }
          return req;
        })
      );
      if (toastMessage) {
        toast({ title: "Request Forwarded", description: toastMessage });
      }
    }
  };

  const handleRejectionSubmit = () => {
    if (!currentRequestToAction || !rejectionReasonInput.trim()) {
      toast({ title: "Rejection Error", description: "Reason for rejection is required.", variant: "destructive" });
      return;
    }
    const requestId = currentRequestToAction.id;
    const employeeName = currentRequestToAction.employeeName;
    let toastMessage = "";

    setPendingRequests(prevRequests =>
      prevRequests.map(req => {
        if (req.id === requestId) {
          toastMessage = `Request ${requestId} for ${employeeName} rejected and returned to HRO.`;
          return { ...req, status: `Rejected by ${role} - Awaiting HRO Correction`, rejectionReason: rejectionReasonInput, reviewStage: 'initial' };
        }
        return req;
      })
    );
    if (toastMessage) {
       toast({ title: "Request Rejected", description: toastMessage, variant: 'destructive' });
    }
    setIsRejectionModalOpen(false);
    setCurrentRequestToAction(null);
    setRejectionReasonInput('');
  };

  const handleCommissionDecision = (requestId: string, decision: 'approved' | 'rejected') => {
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) return;

    const finalStatus = decision === 'approved' ? "Approved by Commission" : "Rejected by Commission";
    let toastMessage = "";
    setPendingRequests(prevRequests =>
      prevRequests.map(req => {
        if (req.id === requestId) {
          toastMessage = `Request ${requestId} for ${req.employeeName} has been ${finalStatus.toLowerCase()}.`;
          return { ...req, status: finalStatus, reviewStage: 'completed' };
        }
        return req;
      })
    );
    if (toastMessage) {
      toast({ title: `Commission Decision: ${decision === 'approved' ? 'Approved' : 'Rejected'}`, description: toastMessage });
    }
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                      <div><Label className="text-muted-foreground">Name:</Label> <p className="font-semibold text-foreground">{employeeDetails.name}</p></div>
                      <div><Label className="text-muted-foreground">ZanID:</Label> <p className="font-semibold text-foreground">{employeeDetails.zanId}</p></div>
                      <div><Label className="text-muted-foreground">Payroll Number:</Label> <p className="font-semibold text-foreground">{employeeDetails.payrollNumber || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">ZSSF Number:</Label> <p className="font-semibold text-foreground">{employeeDetails.zssfNumber || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Department:</Label> <p className="font-semibold text-foreground">{employeeDetails.department || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Cadre/Position:</Label> <p className="font-semibold text-foreground">{employeeDetails.cadre || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Employment Date:</Label> <p className="font-semibold text-foreground">{employeeDetails.employmentDate ? format(parseISO(employeeDetails.employmentDate), 'PPP') : 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Date of Birth:</Label> <p className="font-semibold text-foreground">{employeeDetails.dateOfBirth ? format(parseISO(employeeDetails.dateOfBirth), 'PPP') : 'N/A'}</p></div>
                      <div className="lg:col-span-1"><Label className="text-muted-foreground">Institution:</Label> <p className="font-semibold text-foreground">{employeeDetails.institution || 'N/A'}</p></div>
                      <div className="md:col-span-2 lg:col-span-3"><Label className="text-muted-foreground">Current Status:</Label> <p className={`font-semibold ${isEmployeeOnProbation ? 'text-destructive' : 'text-green-600'}`}>{employeeDetails.status || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>

                {isEmployeeOnProbation && (
                  <div className="flex items-center p-4 mt-2 text-sm text-destructive border border-destructive/50 rounded-md bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span>LWOP is not applicable for employees currently 'On Probation'.</span>
                  </div>
                )}
            
                <div className={`space-y-4 ${isEmployeeOnProbation ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <h3 className="text-lg font-medium text-foreground">LWOP Details</h3>
                  <div>
                    <Label htmlFor="durationLwop">Duration (Max 36 months)</Label>
                    <Input id="durationLwop" placeholder="e.g., 6 months, 1 year, 24" value={duration} onChange={(e) => setDuration(e.target.value)} disabled={isSubmitting || isEmployeeOnProbation} />
                  </div>
                  <div>
                    <Label htmlFor="reasonLwop">Reason for LWOP</Label>
                    <Textarea id="reasonLwop" placeholder="State the reason for the leave request" value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting || isEmployeeOnProbation} />
                  </div>
                  <div>
                    <Label htmlFor="letterOfRequestLwop" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request (PDF Only)</Label>
                    <Input id="letterOfRequestLwop" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting || isEmployeeOnProbation} />
                  </div>
                   <div>
                    <Label htmlFor="employeeConsentLwop" className="flex items-center"><CheckSquare className="mr-2 h-4 w-4 text-primary" />Upload Employee's Consent Letter (PDF Only)</Label>
                    <Input id="employeeConsentLwop" type="file" onChange={(e) => setEmployeeConsentLetterFile(e.target.files)} accept=".pdf" disabled={isSubmitting || isEmployeeOnProbation} />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                <Button onClick={handleSubmitLwopRequest} disabled={!employeeDetails || !duration || !reason || !letterOfRequestFile || !employeeConsentLetterFile || isSubmitting || isEmployeeOnProbation}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit LWOP Request
                </Button>
            </CardFooter>
          )}
        </Card>
      )}

       {(role === ROLES.HHRMD || role === ROLES.HRMO) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review LWOP Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending LWOP requests.</CardDescription>
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
                  <h3 className="font-semibold text-base">LWOP Request for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Duration: {request.duration}</p>
                  <p className="text-sm text-muted-foreground">Reason: {request.reason}</p>
                  <p className="text-sm text-muted-foreground">Submitted: {request.submissionDate ? format(parseISO(request.submissionDate), 'PPP') : 'N/A'} by {request.submittedBy}</p>
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
              <p className="text-muted-foreground">No LWOP requests pending your review.</p>
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
                LWOP request for <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
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
                        <Label className="text-right font-semibold">Duration:</Label>
                        <p className="col-span-2">{selectedRequest.duration}</p>
                    </div>
                    <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold pt-1">Reason:</Label>
                        <p className="col-span-2">{selectedRequest.reason}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Submitted:</Label>
                        <p className="col-span-2">{selectedRequest.submissionDate ? format(parseISO(selectedRequest.submissionDate), 'PPP') : 'N/A'} by {selectedRequest.submittedBy}</p>
                    </div>
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
                    <DialogTitle>Reject LWOP Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the LWOP request for <strong>{currentRequestToAction.employeeName}</strong>. This reason will be visible to the HRO.
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

