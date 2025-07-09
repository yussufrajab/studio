
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
import { Loader2, Search, FileText, CalendarDays, Paperclip } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Pagination } from '@/components/shared/pagination';

interface ResignationRequest {
  id: string;
  employee: Partial<Employee & User & { institution: { name: string } }>;
  submittedBy: Partial<User>;
  reviewedBy?: Partial<User> | null;
  status: string;
  reviewStage: string;
  rejectionReason?: string | null;
  createdAt: string;

  effectiveDate: string;
  reason?: string | null;
  documents: string[];
}

export default function ResignationPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [noticeOrReceiptFile, setNoticeOrReceiptFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [minEffectiveDate, setMinEffectiveDate] = useState('');

  const [pendingRequests, setPendingRequests] = useState<ResignationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ResignationRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<ResignationRequest | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const fetchRequests = async () => {
    if (!user || !role) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/resignation?userId=${user.id}&userRole=${role}&userInstitutionId=${user.institutionId || ''}`);
      if (!response.ok) throw new Error('Failed to fetch resignation requests');
      const data = await response.json();
      setPendingRequests(data);
    } catch (error) {
      toast({ title: "Error", description: "Could not load resignation requests.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    setMinEffectiveDate(format(new Date(), 'yyyy-MM-dd'));
  }, [user, role]);

  const resetFormFields = () => {
    setEffectiveDate('');
    setReason('');
    setNoticeOrReceiptFile(null);
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

  const handleSubmitResignationRequest = async () => {
    if (!employeeDetails || !user) {
      toast({ title: "Submission Error", description: "Employee or user details are missing.", variant: "destructive" });
      return;
    }
    // Validation
    if (!effectiveDate || !letterOfRequestFile || !noticeOrReceiptFile) {
        toast({ title: "Submission Error", description: "Please fill all required fields and upload required documents.", variant: "destructive"});
        return;
    }

    setIsSubmitting(true);
    const documentsList = ['Letter of Request', '3 Month Notice/Receipt'];
    
    const payload = {
        employeeId: employeeDetails.id,
        submittedById: user.id,
        status: role === ROLES.HHRMD ? 'Pending HHRMD Acknowledgement' : 'Pending HRMO Acknowledgement',
        effectiveDate: new Date(effectiveDate).toISOString(),
        reason: reason,
        documents: documentsList
    };

    try {
        const response = await fetch('/api/resignation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to submit resignation request.');

        await fetchRequests();
        toast({ title: "Resignation Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
        setZanId('');
        setEmployeeDetails(null);
        resetFormFields();

    } catch(error) {
        toast({ title: "Submission Failed", description: "Could not submit the resignation request.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleUpdateRequest = async (requestId: string, payload: any) => {
    try {
        const response = await fetch(`/api/resignation/${requestId}`, {
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

  const handleAcknowledge = async (requestId: string) => {
    const payload = { status: "Acknowledged - Awaiting Commission Decision", reviewStage: 'commission_review' };
    const success = await handleUpdateRequest(requestId, payload);
    if(success) toast({ title: "Request Acknowledged", description: "The resignation has been acknowledged and forwarded." });
  };
  
  const handleFlagIssue = (request: ResignationRequest) => {
    setCurrentRequestToAction(request);
    setRejectionReasonInput('');
    setIsRejectionModalOpen(true);
  };
  
  const handleRejectionSubmit = async () => {
     if (!currentRequestToAction || !rejectionReasonInput.trim()) return;
     const payload = {
        status: `Rejected by ${role} - Awaiting HRO Action`,
        rejectionReason: rejectionReasonInput,
        reviewStage: 'initial'
     };
     const success = await handleUpdateRequest(currentRequestToAction.id, payload);
     if(success) {
        toast({ title: "Request Rejected", description: `Request for ${currentRequestToAction.employee.name} has been rejected.`, variant: "destructive" });
        setIsRejectionModalOpen(false);
        setCurrentRequestToAction(null);
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

  const paginatedRequests = pendingRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
                    <Label htmlFor="letterOfRequestResignation" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request (Required, PDF Only)</Label>
                    <Input id="letterOfRequestResignation" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="noticeOrReceiptFile" className="flex items-center"><Paperclip className="mr-2 h-4 w-4 text-primary" />Upload 3 months resignation notice or receipt of resignation equal to employee’s salary (Required, PDF Only)</Label>
                    <Input id="noticeOrReceiptFile" type="file" onChange={(e) => setNoticeOrReceiptFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
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
                    !noticeOrReceiptFile ||
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
            {isLoading ? (
              <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Resignation for: {request.employee.name} (ZanID: {request.employee.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Effective Date: {request.effectiveDate ? format(parseISO(request.effectiveDate), 'PPP') : 'N/A'}</p>
                  {request.reason && <p className="text-sm text-muted-foreground">Reason: {request.reason}</p>}
                  <p className="text-sm text-muted-foreground">Submitted: {request.createdAt ? format(parseISO(request.createdAt), 'PPP') : 'N/A'} by {request.submittedBy.name}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{request.status}</span></p>
                  {request.rejectionReason && <p className="text-sm text-destructive"><span className="font-medium">Rejection Reason:</span> {request.rejectionReason}</p>}
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(request); setIsDetailsModalOpen(true); }}>View Details</Button>
                    {request.reviewStage === 'initial' && request.status.startsWith(`Pending ${role} Acknowledgement`) && (
                      <>
                        <Button size="sm" onClick={() => handleAcknowledge(request.id)}>Acknowledge & Forward</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleFlagIssue(request)}>Flag Issue & Return to HRO</Button>
                      </>
                    )}
                    {request.reviewStage === 'commission_review' && (
                       <>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleCommissionDecision(request.id, 'approved')}>Approve (Commission)</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleCommissionDecision(request.id, 'rejected')}>Reject (Commission)</Button>
                       </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No resignation requests pending review.</p>
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
              <DialogTitle>Request Details: {selectedRequest.id}</DialogTitle>
              <DialogDescription>
                Resignation request for <strong>{selectedRequest.employee.name}</strong> (ZanID: {selectedRequest.employee.zanId}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto">
                <div className="space-y-1 border-b pb-3 mb-3">
                    <h4 className="font-semibold text-base text-foreground mb-2">Employee Information</h4>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Full Name:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.name}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">ZanID:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.zanId}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Payroll #:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.payrollNumber || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">ZSSF #:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.zssfNumber || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Department:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.department}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Cadre/Position:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.cadre}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Employment Date:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.employmentDate ? format(parseISO(selectedRequest.employee.employmentDate), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Date of Birth:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.dateOfBirth ? format(parseISO(selectedRequest.employee.dateOfBirth), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Institution:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.institution?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="space-y-1">
                    <h4 className="font-semibold text-base text-foreground mb-2">Request Information</h4>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Effective Date:</Label>
                        <p className="col-span-2">{selectedRequest.effectiveDate ? format(parseISO(selectedRequest.effectiveDate), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold pt-1">Reason:</Label>
                        <p className="col-span-2">{selectedRequest.reason || 'Not specified'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Submitted:</Label>
                        <p className="col-span-2">{selectedRequest.createdAt ? format(parseISO(selectedRequest.createdAt), 'PPP') : 'N/A'} by {selectedRequest.submittedBy.name}</p>
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
                    <DialogTitle>Flag Issue on Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for flagging this issue for <strong>{currentRequestToAction.employee.name}</strong>. The request will be returned to the HRO.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Textarea
                        placeholder="Enter reason here..."
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        rows={4}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsRejectionModalOpen(false); setCurrentRequestToAction(null); }}>Cancel</Button>
                    <Button variant="destructive" onClick={handleRejectionSubmit} disabled={!rejectionReasonInput.trim()}>Submit Issue</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
