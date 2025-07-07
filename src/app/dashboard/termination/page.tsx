
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
import { Loader2, Search, FileText, CalendarDays, Paperclip, ShieldAlert, FileWarning, PauseOctagon, Files, Ban } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

interface MockPendingSeparationRequest {
  id: string;
  type: 'Termination' | 'Dismissal';
  employeeName: string;
  zanId: string;
  payrollNumber?: string;
  zssfNumber?: string;
  department: string;
  cadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  reasonSummary: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: string;
}

const initialMockPendingRequests: MockPendingSeparationRequest[] = [
  {
    id: 'TERM001',
    type: 'Termination',
    employeeName: 'Ali Juma Ali', 
    zanId: '221458232',
    department: 'Administration',
    cadre: 'Administrative Officer',
    employmentDate: '2023-01-10',
    dateOfBirth: '1980-05-15',
    institution: 'Central Government Office',
    reasonSummary: 'Repeated unauthorized absence and failure to perform duties.',
    submissionDate: '2024-07-25',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending DO Review',
    documents: ['Letter of Request', 'Misconduct Investigation Report', 'Warning Letter(s)'],
    reviewStage: 'initial',
  },
  {
    id: 'TERM002',
    type: 'Termination',
    employeeName: 'Safia Juma Ali', 
    zanId: '125468957',
    department: 'Human Resources',
    cadre: 'HR Officer',
    employmentDate: '2020-12-01',
    dateOfBirth: '1990-11-22',
    institution: 'Civil Service Commission',
    reasonSummary: 'Gross misconduct: Violation of code of conduct (details in report).',
    submissionDate: '2024-07-22',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Letter of Request', 'Misconduct Investigation Report', 'Employee Explanation Letter', 'Investigation Committee Report'],
    reviewStage: 'initial',
  },
  {
    id: 'DISMISS001',
    type: 'Dismissal',
    employeeName: 'Yussuf Makame',
    zanId: '901234567',
    department: 'Primary Education',
    cadre: 'Teacher',
    employmentDate: '2018-08-20',
    dateOfBirth: '1995-04-11',
    institution: 'Ministry of Education',
    reasonSummary: 'Failure to meet performance standards during probation period.',
    submissionDate: '2024-07-29',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending DO Review',
    documents: ['Letter of Request', 'Supporting Document for Dismissal'],
    reviewStage: 'initial',
  },
];

export default function TerminationAndDismissalPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [employeeStatus, setEmployeeStatus] = useState<'probation' | 'confirmed' | null>(null);

  const [reason, setReason] = useState('');

  // Common compulsory document
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  // Dismissal (probation) documents
  const [dismissalSupportingDocFile, setDismissalSupportingDocFile] = useState<FileList | null>(null);

  // Termination (confirmed) documents
  const [misconductEvidenceFile, setMisconductEvidenceFile] = useState<FileList | null>(null);
  const [summonNoticeFile, setSummonNoticeFile] = useState<FileList | null>(null);
  const [suspensionLetterFile, setSuspensionLetterFile] = useState<FileList | null>(null);
  const [warningLettersFile, setWarningLettersFile] = useState<FileList | null>(null);
  const [employeeExplanationLetterFile, setEmployeeExplanationLetterFile] = useState<FileList | null>(null);
  const [otherAdditionalDocumentsFile, setOtherAdditionalDocumentsFile] = useState<FileList | null>(null);

  const [pendingRequests, setPendingRequests] = useState<MockPendingSeparationRequest[]>(initialMockPendingRequests);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingSeparationRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockPendingSeparationRequest | null>(null);

  const resetFormFields = () => {
    setReason('');
    setEmployeeStatus(null);
    setLetterOfRequestFile(null);
    setDismissalSupportingDocFile(null);
    setMisconductEvidenceFile(null);
    setSummonNoticeFile(null);
    setSuspensionLetterFile(null);
    setWarningLettersFile(null);
    setEmployeeExplanationLetterFile(null);
    setOtherAdditionalDocumentsFile(null);
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
        setEmployeeStatus(foundEmployee.status === 'On Probation' ? 'probation' : 'confirmed');
        toast({ title: "Employee Found", description: `Details for ${foundEmployee.name} loaded.` });
      } else {
        toast({ title: "Employee Not Found", description: `No employee found with ZanID: ${zanId}.`, variant: "destructive" });
      }
      setIsFetchingEmployee(false);
    }, 1000);
  };

  const handleSubmitRequest = () => {
    if (!employeeDetails || !employeeStatus) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!reason) {
      toast({ title: "Submission Error", description: "Reason is required.", variant: "destructive" });
      return;
    }
    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => !fileList || (fileList[0] && fileList[0].type === "application/pdf");

    // Common validation
    if (!checkPdf(letterOfRequestFile)) { toast({ title: "File Error", description: "Letter of Request must be a PDF.", variant: "destructive" }); return; }
    
    let documentsList: string[] = ['Letter of Request'];
    let type: 'Termination' | 'Dismissal';
    
    // Conditional validation
    if (employeeStatus === 'probation') {
      type = 'Dismissal';
      if (!dismissalSupportingDocFile) { toast({ title: "Submission Error", description: "Supporting Document for Dismissal is required.", variant: "destructive" }); return; }
      if (!checkPdf(dismissalSupportingDocFile)) { toast({ title: "File Error", description: "Supporting Document must be a PDF.", variant: "destructive" }); return; }
      documentsList.push('Supporting Document for Dismissal');
    } else { // confirmed status
      type = 'Termination';
      if (!misconductEvidenceFile) { toast({ title: "Submission Error", description: "Misconduct Evidence & Investigation Report is required.", variant: "destructive" }); return; }
      if (!summonNoticeFile) { toast({ title: "Submission Error", description: "Summon Notice / Invitation Letter is required.", variant: "destructive" }); return; }
      if (!suspensionLetterFile) { toast({ title: "Submission Error", description: "Suspension Letter is required.", variant: "destructive" }); return; }
      
      if (!checkPdf(misconductEvidenceFile)) { toast({ title: "File Error", description: "Misconduct Evidence must be a PDF.", variant: "destructive" }); return; }
      if (!checkPdf(summonNoticeFile)) { toast({ title: "File Error", description: "Summon Notice must be a PDF.", variant: "destructive" }); return; }
      if (!checkPdf(suspensionLetterFile)) { toast({ title: "File Error", description: "Suspension Letter must be a PDF.", variant: "destructive" }); return; }
      if (!checkPdf(warningLettersFile)) { toast({ title: "File Error", description: "Warning Letter(s) must be a PDF.", variant: "destructive" }); return; }
      if (!checkPdf(employeeExplanationLetterFile)) { toast({ title: "File Error", description: "Employee Explanation Letter must be a PDF.", variant: "destructive" }); return; }
      if (!checkPdf(otherAdditionalDocumentsFile)) { toast({ title: "File Error", description: "Other Additional Documents must be a PDF.", variant: "destructive" }); return; }

      documentsList.push('Misconduct Evidence & Investigation Report', 'Summon Notice/Invitation Letter', 'Suspension Letter');
      if (warningLettersFile) documentsList.push('Warning Letter(s)');
      if (employeeExplanationLetterFile) documentsList.push('Employee Explanation Letter');
      if (otherAdditionalDocumentsFile) documentsList.push('Other Additional Document(s)');
    }

    setIsSubmitting(true);
    const newRequestId = `SEP${Date.now().toString().slice(-3)}`;
    
    const newRequest: MockPendingSeparationRequest = {
        id: newRequestId,
        type: type,
        employeeName: employeeDetails.name,
        zanId: employeeDetails.zanId,
        payrollNumber: employeeDetails.payrollNumber,
        zssfNumber: employeeDetails.zssfNumber,
        department: employeeDetails.department || 'N/A',
        cadre: employeeDetails.cadre || 'N/A',
        employmentDate: employeeDetails.employmentDate || 'N/A',
        dateOfBirth: employeeDetails.dateOfBirth || 'N/A',
        institution: employeeDetails.institution || 'N/A',
        reasonSummary: reason,
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        submittedBy: `${user?.name} (${user?.role})`,
        status: role === ROLES.DO ? 'Pending DO Review' : (role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending Review'),
        documents: documentsList,
        reviewStage: 'initial',
    };

    console.log(`Submitting ${type} Request:`, newRequest);

    setTimeout(() => {
      setPendingRequests(prev => [newRequest, ...prev]);
      toast({ title: `${type} Request Submitted`, description: `Request for ${employeeDetails.name} submitted successfully.` });
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
      setPendingRequests(prevRequests =>
        prevRequests.map(req =>
          req.id === requestId
            ? { ...req, status: "Request Received – Awaiting Commission Decision", reviewStage: 'commission_review', reviewedBy: role || undefined }
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
    const { id, employeeName } = currentRequestToAction;
    setPendingRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === id
          ? { ...req, status: `Rejected by ${role} - Awaiting HRO Correction`, rejectionReason: rejectionReasonInput, reviewStage: 'initial' }
          : req
      )
    );
    toast({ title: "Request Rejected", description: `Request ${id} for ${employeeName} rejected and returned to HRO.`, variant: 'destructive' });
    setIsRejectionModalOpen(false);
    setCurrentRequestToAction(null);
  };

  const handleCommissionDecision = (requestId: string, decision: 'approved' | 'rejected') => {
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) return;

    const finalStatus = decision === 'approved' ? "Approved by Commission" : "Rejected by Commission";
    setPendingRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId
          ? { ...req, status: finalStatus, reviewStage: 'completed' }
          : req
      )
    );
    toast({ title: `Commission Decision: ${decision === 'approved' ? 'Approved' : 'Rejected'}`, description: `Request ${requestId} for ${request.employeeName} has been ${finalStatus.toLowerCase()}.` });
  };
  
  const isSubmitButtonDisabled = () => {
    if (!employeeDetails || !employeeStatus || !reason || !letterOfRequestFile || isSubmitting) {
        return true;
    }
    if (employeeStatus === 'probation') {
        return !dismissalSupportingDocFile;
    }
    if (employeeStatus === 'confirmed') {
        return !misconductEvidenceFile || !summonNoticeFile || !suspensionLetterFile;
    }
    return true;
  };

  return (
    <div>
      <PageHeader title="Termination and Dismissal" description="Process employee terminations for confirmed staff and dismissals for probationers." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Termination or Dismissal Request</CardTitle>
            <CardDescription>Enter ZanID to fetch employee details. The required form will appear based on the employee's status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdInput">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdInput" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
                <Button onClick={handleFetchEmployeeDetails} disabled={isFetchingEmployee || !zanId || isSubmitting}>
                  {isFetchingEmployee ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Fetch Details
                </Button>
              </div>
            </div>

            {employeeDetails && employeeStatus && (
              <div className="space-y-6 pt-2">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Employee Details</h3>
                  <div className="p-4 rounded-md border bg-secondary/20 space-y-3 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                      <div><Label className="text-muted-foreground">Name:</Label> <p className="font-semibold text-foreground">{employeeDetails.name}</p></div>
                      <div><Label className="text-muted-foreground">ZanID:</Label> <p className="font-semibold text-foreground">{employeeDetails.zanId}</p></div>
                      <div className="md:col-span-2 lg:col-span-3"><Label className="text-muted-foreground">Current Status:</Label> <p className={`font-semibold ${employeeDetails.status === 'On Probation' ? 'text-orange-600' : 'text-green-600'}`}>{employeeDetails.status || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">{employeeStatus === 'probation' ? 'Dismissal' : 'Termination'} Details &amp; Documents</h3>
                  <div>
                    <Label htmlFor="reason">Reason for Firing</Label>
                    <Textarea id="reason" placeholder="Clearly state the grounds for firing..." value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting} />
                  </div>
                  
                  {/* Common Document */}
                  <div>
                    <Label htmlFor="letterOfRequestFile" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request (Required, PDF)</Label>
                    <Input id="letterOfRequestFile" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  
                  {/* Dismissal Documents */}
                  {employeeStatus === 'probation' && (
                    <div>
                      <Label htmlFor="dismissalSupportingDocFile" className="flex items-center"><Paperclip className="mr-2 h-4 w-4 text-primary" />Upload Supporting Document for Dismissal (Required, PDF)</Label>
                      <Input id="dismissalSupportingDocFile" type="file" onChange={(e) => setDismissalSupportingDocFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                    </div>
                  )}

                  {/* Termination Documents */}
                  {employeeStatus === 'confirmed' && (
                    <>
                      <h4 className="text-md font-medium text-foreground pt-2">Required Termination Documents (PDF Only)</h4>
                      <div>
                        <Label htmlFor="misconductEvidenceFile" className="flex items-center"><ShieldAlert className="mr-2 h-4 w-4 text-destructive" />Upload Misconduct Evidence &amp; Primary Investigation Report</Label>
                        <Input id="misconductEvidenceFile" type="file" onChange={(e) => setMisconductEvidenceFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                      </div>
                      <div>
                        <Label htmlFor="summonNoticeFile" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Summon Notice / Invitation Letter</Label>
                        <Input id="summonNoticeFile" type="file" onChange={(e) => setSummonNoticeFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                      </div>
                      <div>
                        <Label htmlFor="suspensionLetterFile" className="flex items-center"><PauseOctagon className="mr-2 h-4 w-4 text-red-500" />Upload Suspension Letter</Label>
                        <Input id="suspensionLetterFile" type="file" onChange={(e) => setSuspensionLetterFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                      </div>
                      <h4 className="text-md font-medium text-foreground pt-2">Optional Supporting Documents (PDF Only)</h4>
                      <div>
                        <Label htmlFor="warningLettersFile" className="flex items-center"><FileWarning className="mr-2 h-4 w-4 text-orange-500" />Upload Warning Letter(s)</Label>
                        <Input id="warningLettersFile" type="file" onChange={(e) => setWarningLettersFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                      </div>
                      <div>
                        <Label htmlFor="employeeExplanationLetterFile" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Employee Explanation Letter</Label>
                        <Input id="employeeExplanationLetterFile" type="file" onChange={(e) => setEmployeeExplanationLetterFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                      </div>
                      <div>
                        <Label htmlFor="otherAdditionalDocumentsFile" className="flex items-center"><Files className="mr-2 h-4 w-4 text-primary" />Upload Other Additional Documents</Label>
                        <Input id="otherAdditionalDocumentsFile" type="file" onChange={(e) => setOtherAdditionalDocumentsFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && employeeStatus && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button onClick={handleSubmitRequest} disabled={isSubmitButtonDisabled()}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit {employeeStatus === 'probation' ? 'Dismissal' : 'Termination'} Request
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
      {(role === ROLES.DO || role === ROLES.HHRMD ) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Termination &amp; Dismissal Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingRequests.filter(req =>
                (role === ROLES.DO && req.status === 'Pending DO Review') ||
                (role === ROLES.HHRMD && req.status === 'Pending HHRMD Review') ||
                req.status === 'Request Received – Awaiting Commission Decision' ||
                req.status.startsWith('Rejected by') || req.status.startsWith('Approved by Commission') || req.status.startsWith('Rejected by Commission')
            ).length > 0 ? (
              pendingRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">{request.type} for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Reason: {request.reasonSummary}</p>
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
              <p className="text-muted-foreground">No requests pending your review.</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedRequest && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedRequest.type} Request Details: {selectedRequest.id}</DialogTitle>
              <DialogDescription>
                For <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto">
                <div className="space-y-1 border-b pb-3 mb-3">
                    <h4 className="font-semibold text-base text-foreground mb-2">Employee Information</h4>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">Name:</Label><p className="col-span-2 font-medium">{selectedRequest.employeeName}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">ZanID:</Label><p className="col-span-2 font-medium">{selectedRequest.zanId}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">Payroll #:</Label><p className="col-span-2 font-medium">{selectedRequest.payrollNumber || 'N/A'}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">ZSSF #:</Label><p className="col-span-2 font-medium">{selectedRequest.zssfNumber || 'N/A'}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">Department:</Label><p className="col-span-2 font-medium">{selectedRequest.department}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">Institution:</Label><p className="col-span-2 font-medium">{selectedRequest.institution || 'N/A'}</p></div>
                </div>
                 <div className="space-y-1">
                     <h4 className="font-semibold text-base text-foreground mb-2">Request Information</h4>
                     <div className="space-y-2">
                        <div><Label className="font-semibold">Reason Summary:</Label><p className="pl-2">{selectedRequest.reasonSummary}</p></div>
                        <p><Label className="font-semibold">Submitted:</Label> {selectedRequest.submissionDate ? format(parseISO(selectedRequest.submissionDate), 'PPP') : 'N/A'} by {selectedRequest.submittedBy}</p>
                        <p><Label className="font-semibold">Status:</Label> <span className="text-primary">{selectedRequest.status}</span></p>
                        {selectedRequest.rejectionReason && (
                           <div><Label className="font-semibold text-destructive">Rejection Reason:</Label><p className="pl-2 text-destructive">{selectedRequest.rejectionReason}</p></div>
                        )}
                    </div>
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
                    <DialogTitle>Reject Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the request for <strong>{currentRequestToAction.employeeName}</strong>. This reason will be visible to the HRO.
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
                    <Button variant="outline" onClick={() => { setIsRejectionModalOpen(false); setCurrentRequestToAction(null); setRejectionReasonInput(''); }}>Cancel</Button>
                    <Button variant="destructive" onClick={handleRejectionSubmit} disabled={!rejectionReasonInput.trim()}>Submit Rejection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
