
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
import type { Employee, User, Role } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, CalendarDays, Paperclip, ShieldAlert, FileWarning, PauseOctagon, Files, Ban } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Pagination } from '@/components/shared/pagination';


interface SeparationRequest {
  id: string;
  employee: Partial<Employee & User & { institution: { name: string } }>;
  submittedBy: Partial<User>;
  reviewedBy?: Partial<User> | null;
  status: string;
  reviewStage: string;
  rejectionReason?: string | null;
  createdAt: string;
  type: 'TERMINATION' | 'DISMISSAL';
  reason: string;
  documents: string[];
}


export default function TerminationAndDismissalPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

  const [pendingRequests, setPendingRequests] = useState<SeparationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SeparationRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<SeparationRequest | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    if (!user || !role) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/termination?userId=${user.id}&userRole=${role}&userInstitutionId=${user.institutionId || ''}`);
      if (!response.ok) throw new Error('Failed to fetch separation requests');
      const data = await response.json();
      setPendingRequests(data);
    } catch (error) {
      toast({ title: "Error", description: "Could not load separation requests.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user, role]);


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
  
  const handleUpdateRequest = async (requestId: string, payload: any) => {
    try {
        const response = await fetch(`/api/termination/${requestId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({...payload, reviewedById: user?.id })
        });
        if (!response.ok) throw new Error('Failed to update request');
        await fetchRequests();
        return true;
    } catch (error) {
        toast({ title: "Update Failed", description: "Could not update the request.", variant: "destructive" });
        return false;
    }
  };

  const handleSubmitRequest = async () => {
    if (!employeeDetails || !employeeStatus || !user) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    // Validation checks...

    let documentsList: string[] = ['Letter of Request'];
    let type: 'TERMINATION' | 'DISMISSAL';
    
    if (employeeStatus === 'probation') {
      type = 'DISMISSAL';
      documentsList.push('Supporting Document for Dismissal');
    } else {
      type = 'TERMINATION';
      documentsList.push('Misconduct Evidence & Investigation Report', 'Summon Notice/Invitation Letter', 'Suspension Letter');
      if (warningLettersFile) documentsList.push('Warning Letter(s)');
      if (employeeExplanationLetterFile) documentsList.push('Employee Explanation Letter');
      if (otherAdditionalDocumentsFile) documentsList.push('Other Additional Document(s)');
    }

    setIsSubmitting(true);
    
    const payload = {
      employeeId: employeeDetails.id,
      submittedById: user.id,
      status: role === ROLES.DO ? 'Pending DO Review' : (role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending Review'),
      reason: reason,
      type,
      documents: documentsList
    };

    try {
        const response = await fetch('/api/termination', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to submit request');
        
        await fetchRequests(); // Refresh list
        toast({ title: "Request Submitted", description: `${type} request for ${employeeDetails.name} submitted successfully.` });
        setZanId('');
        setEmployeeDetails(null);
        resetFormFields();
    } catch(error) {
        toast({ title: "Submission Failed", description: "Could not submit the request.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleInitialAction = async (requestId: string, action: 'forward' | 'reject') => {
    const request = pendingRequests.find(req => req.id === requestId);
    if (!request) return;

    if (action === 'reject') {
      setCurrentRequestToAction(request);
      setRejectionReasonInput('');
      setIsRejectionModalOpen(true);
    } else if (action === 'forward') {
      const payload = { status: "Request Received – Awaiting Commission Decision", reviewStage: 'commission_review' };
      const success = await handleUpdateRequest(requestId, payload);
      if (success) toast({ title: "Request Forwarded", description: `Request for ${request.employee.name} forwarded to Commission.` });
    }
  };

  const handleRejectionSubmit = async () => {
    if (!currentRequestToAction || !rejectionReasonInput.trim() || !user) return;
    const payload = { 
        status: `Rejected by ${role} - Awaiting HRO Correction`, 
        rejectionReason: rejectionReasonInput, 
        reviewStage: 'initial'
    };
    const success = await handleUpdateRequest(currentRequestToAction.id, payload);
    if (success) {
      toast({ title: "Request Rejected", description: `Request for ${currentRequestToAction.employee.name} rejected.`, variant: 'destructive' });
      setIsRejectionModalOpen(false);
      setCurrentRequestToAction(null);
      setRejectionReasonInput('');
    }
  };

  const handleCommissionDecision = async (requestId: string, decision: 'approved' | 'rejected') => {
    const finalStatus = decision === 'approved' ? "Approved by Commission" : "Rejected by Commission";
    const payload = { status: finalStatus, reviewStage: 'completed' };
    const success = await handleUpdateRequest(requestId, payload);
    if (success) {
        toast({ title: `Commission Decision: ${decision === 'approved' ? 'Approved' : 'Rejected'}`, description: `Request ${requestId} has been updated.` });
    }
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

  const paginatedRequests = pendingRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


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
            {isLoading ? (
                <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">{request.type} for: {request.employee.name} (ZanID: {request.employee.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Reason: {request.reason}</p>
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
                     {request.reviewStage === 'commission_review' && (
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
             <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(pendingRequests.length / itemsPerPage)}
              onPageChange={setCurrentPage}
              totalItems={pendingRequests.length}
              itemsPerPage={itemsPerPage}
            />
          </CardContent>
        </Card>
      )}

      {selectedRequest && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{selectedRequest.type} Request Details: {selectedRequest.id}</DialogTitle>
              <DialogDescription>
                For <strong>{selectedRequest.employee.name}</strong> (ZanID: {selectedRequest.employee.zanId}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto">
                <div className="space-y-1 border-b pb-3 mb-3">
                    <h4 className="font-semibold text-base text-foreground mb-2">Employee Information</h4>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">Name:</Label><p className="col-span-2 font-medium">{selectedRequest.employee.name}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">ZanID:</Label><p className="col-span-2 font-medium">{selectedRequest.employee.zanId}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">Payroll #:</Label><p className="col-span-2 font-medium">{selectedRequest.employee.payrollNumber || 'N/A'}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">ZSSF #:</Label><p className="col-span-2 font-medium">{selectedRequest.employee.zssfNumber || 'N/A'}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">Department:</Label><p className="col-span-2 font-medium">{selectedRequest.employee.department}</p></div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1"><Label className="text-right text-muted-foreground">Institution:</Label><p className="col-span-2 font-medium">{selectedRequest.employee.institution?.name || 'N/A'}</p></div>
                </div>
                 <div className="space-y-1">
                     <h4 className="font-semibold text-base text-foreground mb-2">Request Information</h4>
                     <div className="space-y-2">
                        <div><Label className="font-semibold">Reason Summary:</Label><p className="pl-2">{selectedRequest.reason}</p></div>
                        <p><Label className="font-semibold">Submitted:</Label> {selectedRequest.createdAt ? format(parseISO(selectedRequest.createdAt), 'PPP') : 'N/A'} by {selectedRequest.submittedBy.name}</p>
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
                        Please provide the reason for rejecting the request for <strong>{currentRequestToAction.employee.name}</strong>. This reason will be visible to the HRO.
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
