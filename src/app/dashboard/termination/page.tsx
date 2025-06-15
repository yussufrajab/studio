
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
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface MockPendingTerminationRequest {
  id: string;
  employeeName: string;
  zanId: string;
  department: string;
  cadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  reasonSummary: string;
  proposedDate: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: string;
}

const initialMockPendingTerminationRequests: MockPendingTerminationRequest[] = [
  {
    id: 'TERM001',
    employeeName: 'Ali Juma Ali', 
    zanId: '221458232',
    department: 'Administration',
    cadre: 'Administrative Officer',
    employmentDate: '2023-01-10',
    dateOfBirth: '1980-05-15',
    institution: 'Central Government Office',
    reasonSummary: 'Repeated unauthorized absence and failure to perform duties.',
    proposedDate: '2024-09-01',
    submissionDate: '2024-07-25',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending DO Review',
    documents: ['Misconduct Evidence & Investigation Report', 'Warning Letters', 'Letter of Request'],
    reviewStage: 'initial',
  },
  {
    id: 'TERM002',
    employeeName: 'Safia Juma Ali', 
    zanId: '125468957',
    department: 'Human Resources',
    cadre: 'HR Officer',
    employmentDate: '2020-12-01',
    dateOfBirth: '1990-11-22',
    institution: 'Civil Service Commission',
    reasonSummary: 'Gross misconduct: Violation of code of conduct (details in report).',
    proposedDate: '2024-08-20',
    submissionDate: '2024-07-22',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Misconduct Investigation Report', 'Code of Conduct Violation Details', 'Letter of Request'],
    reviewStage: 'initial',
  },
];

export default function TerminationPage() {
  const { role, user } = useAuth();
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

  const [pendingRequests, setPendingRequests] = useState<MockPendingTerminationRequest[]>(initialMockPendingTerminationRequests);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingTerminationRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockPendingTerminationRequest | null>(null);

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
    if (!reasonTermination || !proposedDateTermination) {
      toast({ title: "Submission Error", description: "Reason for Termination and Proposed Date are required.", variant: "destructive" });
      return;
    }
    if (!misconductEvidenceFile) {
      toast({ title: "Submission Error", description: "Misconduct Evidence & Investigation Report is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
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
    const newRequestId = `TERM${Date.now().toString().slice(-3)}`;
    let documentsList = ['Letter of Request', 'Misconduct Evidence & Investigation Report'];
    if (supportingDocumentsFile) documentsList.push('Supporting Documents');

    const newRequest: MockPendingTerminationRequest = {
        id: newRequestId,
        employeeName: employeeDetails.name,
        zanId: employeeDetails.zanId,
        department: employeeDetails.department || 'N/A',
        cadre: employeeDetails.cadre || 'N/A',
        employmentDate: employeeDetails.employmentDate || 'N/A',
        dateOfBirth: employeeDetails.dateOfBirth || 'N/A',
        institution: employeeDetails.institution || 'N/A',
        reasonSummary: reasonTermination,
        proposedDate: proposedDateTermination,
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        submittedBy: `${user?.name} (${user?.role})`,
        status: role === ROLES.DO ? 'Pending DO Review' : (role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending Review'), 
        documents: documentsList,
        reviewStage: 'initial',
    };

    console.log("Submitting Termination Request:", {
      employee: employeeDetails,
      reasonTermination,
      proposedDateTermination,
      misconductEvidenceFile: misconductEvidenceFile[0]?.name,
      supportingDocumentsFile: supportingDocumentsFile ? supportingDocumentsFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
      setPendingRequests(prev => [newRequest, ...prev]);
      toast({ title: "Termination Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
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
      if(toastMessage) {
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
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Termination Details &amp; Documents</h3>
                  <div>
                    <Label htmlFor="reasonTermination">Reason for Termination &amp; Summary of Misconduct</Label>
                    <Textarea id="reasonTermination" placeholder="Clearly state the grounds for termination and summarize evidence" value={reasonTermination} onChange={(e) => setReasonTermination(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="proposedDateTermination" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Proposed Date of Termination</Label>
                    <Input id="proposedDateTermination" type="date" value={proposedDateTermination} onChange={(e) => setProposedDateTermination(e.target.value)} disabled={isSubmitting} min={minProposedDate} />
                  </div>
                  <div>
                    <Label htmlFor="misconductEvidenceFile" className="flex items-center"><ShieldAlert className="mr-2 h-4 w-4 text-destructive" />Upload Misconduct Evidence &amp; Investigation Report (PDF Only)</Label>
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
            {pendingRequests.filter(req => 
                (role === ROLES.DO && req.status === 'Pending DO Review') ||
                (role === ROLES.HHRMD && req.status === 'Pending HHRMD Review') ||
                req.status === 'Request Received – Awaiting Commission Decision' ||
                req.status.startsWith('Rejected by') || req.status.startsWith('Approved by Commission') || req.status.startsWith('Rejected by Commission')
            ).length > 0 ? (
              pendingRequests.filter(req => 
                (role === ROLES.DO && req.status === 'Pending DO Review') ||
                (role === ROLES.HHRMD && req.status === 'Pending HHRMD Review') ||
                req.status === 'Request Received – Awaiting Commission Decision' ||
                req.status.startsWith('Rejected by') || req.status.startsWith('Approved by Commission') || req.status.startsWith('Rejected by Commission')
              ).map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Termination for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Reason: {request.reasonSummary}</p>
                  <p className="text-sm text-muted-foreground">Proposed Date: {request.proposedDate ? format(parseISO(request.proposedDate), 'PPP') : 'N/A'}</p>
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
              <p className="text-muted-foreground">No termination requests pending your review.</p>
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
                Termination request for <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
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
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employmentDate ? format(parseISO(selectedRequest.employmentDate), 'PPP') : 'N/A'}</p></div>
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
                    <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold pt-1">Reason Summary:</Label>
                        <p className="col-span-2">{selectedRequest.reasonSummary}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Proposed Date:</Label>
                        <p className="col-span-2">{selectedRequest.proposedDate ? format(parseISO(selectedRequest.proposedDate), 'PPP') : 'N/A'}</p>
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
                    <DialogTitle>Reject Termination Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the termination request for <strong>{currentRequestToAction.employeeName}</strong>. This reason will be visible to the HRO.
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

    