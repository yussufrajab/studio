
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import type { Employee, User, Role } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, Award, ChevronsUpDown, ListFilter, Star, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parseISO, differenceInYears } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pagination } from '@/components/shared/pagination';

interface PromotionRequest {
  id: string;
  employee: Partial<Employee & User & { institution: { name: string } }>;
  submittedBy: Partial<User>;
  reviewedBy?: Partial<User> | null;
  status: string;
  reviewStage: string;
  rejectionReason?: string | null;
  createdAt: string;

  proposedCadre: string;
  promotionType: 'Experience' | 'EducationAdvancement';
  documents: string[];
  studiedOutsideCountry?: boolean | null;
}

export default function PromotionPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [promotionRequestType, setPromotionRequestType] = useState<'experience' | 'education' | ''>('');
  const [proposedCadre, setProposedCadre] = useState('');

  // Experience-based promotion files
  const [performanceAppraisalFileY1, setPerformanceAppraisalFileY1] = useState<FileList | null>(null);
  const [performanceAppraisalFileY2, setPerformanceAppraisalFileY2] = useState<FileList | null>(null);
  const [performanceAppraisalFileY3, setPerformanceAppraisalFileY3] = useState<FileList | null>(null);
  const [cscPromotionFormFile, setCscPromotionFormFile] = useState<FileList | null>(null);

  // Education-based promotion files
  const [certificateFile, setCertificateFile] = useState<FileList | null>(null);
  const [studiedOutsideCountry, setStudiedOutsideCountry] = useState(false);
  const [tcuFormFile, setTcuFormFile] = useState<FileList | null>(null);
  
  // Common file
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  const [pendingRequests, setPendingRequests] = useState<PromotionRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<PromotionRequest | null>(null);

  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    if (!user || !role) return;
    setIsLoading(true);
    try {
        const response = await fetch(`/api/promotions?userId=${user.id}&userRole=${role}&userInstitutionId=${user.institutionId || ''}`);
        if (!response.ok) throw new Error('Failed to fetch promotion requests');
        const data = await response.json();
        setPendingRequests(data);
    } catch (error) {
        toast({ title: "Error", description: "Could not load promotion requests.", variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user, role]);

  const resetFormFields = () => {
    setPromotionRequestType('');
    setProposedCadre('');
    setPerformanceAppraisalFileY1(null);
    setPerformanceAppraisalFileY2(null);
    setPerformanceAppraisalFileY3(null);
    setCscPromotionFormFile(null);
    setCertificateFile(null);
    setStudiedOutsideCountry(false);
    setTcuFormFile(null);
    setLetterOfRequestFile(null);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => (input as HTMLInputElement).value = '');
    const checkboxInput = document.getElementById('studiedOutsideCountryPromo') as HTMLInputElement;
    if (checkboxInput) checkboxInput.checked = false;
  };

  const handleFetchEmployeeDetails = async () => {
    if (!zanId) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID.", variant: "destructive" });
      return;
    }
    setIsFetchingEmployee(true);
    setEmployeeDetails(null);
    resetFormFields();
    setEligibilityError(null);

    try {
        const response = await fetch(`/api/employees/search?zanId=${zanId}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || "Employee not found");
        }
        const foundEmployee: Employee = await response.json();

        let error = null;
        if (foundEmployee.status === 'On Probation' || foundEmployee.status === 'On LWOP') {
          error = `Employee is currently '${foundEmployee.status}' and is not eligible for promotion.`;
        } else if (foundEmployee.employmentDate) {
          const yearsOfService = differenceInYears(new Date(), parseISO(foundEmployee.employmentDate.toString()));
          if (yearsOfService < 3) {
            error = `Employee must have at least 3 years of service for promotion. Current service: ${yearsOfService} years.`;
          }
        }

        setEmployeeDetails(foundEmployee);

        if (error) {
          setEligibilityError(error);
          toast({ title: "Employee Ineligible", description: error, variant: "destructive", duration: 7000 });
        } else {
          setEligibilityError(null);
          toast({ title: "Employee Found", description: `Details for ${foundEmployee.name} loaded.` });
        }
    } catch (error: any) {
        toast({ title: "Employee Not Found", description: error.message || `No employee found with ZanID: ${zanId}.`, variant: "destructive" });
    } finally {
        setIsFetchingEmployee(false);
    }
  };

  const handleSubmitPromotionRequest = async () => {
    if (!!eligibilityError) {
      toast({ title: "Submission Error", description: "This employee is ineligible for promotion.", variant: "destructive" });
      return;
    }
    if (!employeeDetails || !user) {
      toast({ title: "Submission Error", description: "Employee or user details are missing.", variant: "destructive" });
      return;
    }
    // Validation logic...
    setIsSubmitting(true);
    
    let documentsList: string[] = ['Letter of Request'];
    if (promotionRequestType === 'experience') {
      documentsList.push('Performance Appraisal (Y1)', 'Performance Appraisal (Y2)', 'Performance Appraisal (Y3)', 'CSC Promotion Form');
    } else if (promotionRequestType === 'education') {
      documentsList.push('Academic Certificate');
      if (studiedOutsideCountry) documentsList.push('TCU Form');
    }
    
    const payload = {
      employeeId: employeeDetails.id,
      submittedById: user.id,
      status: role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending HRMO Review',
      proposedCadre,
      promotionType: promotionRequestType === 'experience' ? 'Experience' : 'EducationAdvancement',
      documents: documentsList,
      studiedOutsideCountry: promotionRequestType === 'education' ? studiedOutsideCountry : undefined,
    };
    
    try {
        const response = await fetch('/api/promotions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Failed to submit request');
        
        await fetchRequests(); // Refresh list
        toast({ title: "Promotion Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
        setZanId('');
        setEmployeeDetails(null);
        resetFormFields();
    } catch(error) {
        toast({ title: "Submission Failed", description: "Could not submit the promotion request.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleUpdateRequest = async (requestId: string, payload: any) => {
      try {
          const response = await fetch(`/api/promotions/${requestId}`, {
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

  const isSubmitDisabled = () => {
    if (!!eligibilityError || isSubmitting || !employeeDetails || !promotionRequestType || !letterOfRequestFile) {
      return true;
    }
    
    if (promotionRequestType === 'experience') {
      return !proposedCadre || !performanceAppraisalFileY1 || !performanceAppraisalFileY2 || !performanceAppraisalFileY3 || !cscPromotionFormFile;
    }
    
    if (promotionRequestType === 'education') {
      return !certificateFile || (studiedOutsideCountry && !tcuFormFile);
    }
    
    return true; 
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

  const paginatedRequests = pendingRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <PageHeader title="Promotion" description="Manage employee promotions based on experience or education." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Promotion Request</CardTitle>
            <CardDescription>Enter ZanID, select promotion type, then complete the form. All documents must be PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdPromo">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdPromo" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
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
                      <div><Label className="text-muted-foreground">Current Cadre/Position:</Label> <p className="font-semibold text-foreground">{employeeDetails.cadre || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Employment Date:</Label> <p className="font-semibold text-foreground">{employeeDetails.employmentDate ? format(parseISO(employeeDetails.employmentDate.toString()), 'PPP') : 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Date of Birth:</Label> <p className="font-semibold text-foreground">{employeeDetails.dateOfBirth ? format(parseISO(employeeDetails.dateOfBirth.toString()), 'PPP') : 'N/A'}</p></div>
                      <div className="lg:col-span-1"><Label className="text-muted-foreground">Institution:</Label> <p className="font-semibold text-foreground">{typeof employeeDetails.institution === 'object' ? employeeDetails.institution.name : employeeDetails.institution || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>
                
                {eligibilityError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Ineligibility Notice</AlertTitle>
                    <AlertDescription>
                      {eligibilityError}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                    <Label htmlFor="promotionTypeSelect" className="flex items-center"><ListFilter className="mr-2 h-4 w-4 text-primary" />Promotion Type</Label>
                    <Select value={promotionRequestType} onValueChange={(value) => setPromotionRequestType(value as 'experience' | 'education' | '')} disabled={isSubmitting || !!eligibilityError}>
                      <SelectTrigger id="promotionTypeSelect">
                        <SelectValue placeholder="Select promotion type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="experience">Promotion Based on Experience (Performance)</SelectItem>
                        <SelectItem value="education">Promotion Based on Education Advancement</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            
                {promotionRequestType && (
                    <div className={`space-y-4 ${!!eligibilityError ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <h3 className="text-lg font-medium text-foreground">Promotion Details &amp; Documents (PDF Only)</h3>

                        {promotionRequestType === 'experience' && (
                            <>
                                <div>
                                    <Label htmlFor="proposedCadre">Proposed New Grade</Label>
                                    <Input id="proposedCadre" placeholder="e.g., Senior Officer Grade I" value={proposedCadre} onChange={(e) => setProposedCadre(e.target.value)} disabled={isSubmitting || !!eligibilityError} />
                                </div>
                                <div>
                                <Label htmlFor="performanceAppraisalFileY1" className="flex items-center"><Star className="mr-2 h-4 w-4 text-primary" />Upload Performance Appraisal Form (Year 1)</Label>
                                <Input id="performanceAppraisalFileY1" type="file" onChange={(e) => setPerformanceAppraisalFileY1(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                                </div>
                                <div>
                                <Label htmlFor="performanceAppraisalFileY2" className="flex items-center"><Star className="mr-2 h-4 w-4 text-primary" />Upload Performance Appraisal Form (Year 2)</Label>
                                <Input id="performanceAppraisalFileY2" type="file" onChange={(e) => setPerformanceAppraisalFileY2(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                                </div>
                                <div>
                                <Label htmlFor="performanceAppraisalFileY3" className="flex items-center"><Star className="mr-2 h-4 w-4 text-primary" />Upload Performance Appraisal Form (Year 3)</Label>
                                <Input id="performanceAppraisalFileY3" type="file" onChange={(e) => setPerformanceAppraisalFileY3(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                                </div>
                                <div>
                                <Label htmlFor="cscPromotionFormFile" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Civil Service Commission Promotion Form (Tume ya Utumishi)</Label>
                                <Input id="cscPromotionFormFile" type="file" onChange={(e) => setCscPromotionFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                                </div>
                            </>
                        )}

                        {promotionRequestType === 'education' && (
                            <>
                                <div>
                                <Label htmlFor="certificateFilePromo" className="flex items-center"><Award className="mr-2 h-4 w-4 text-primary" />Upload Academic Certificate</Label>
                                <Input id="certificateFilePromo" type="file" onChange={(e) => setCertificateFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                                </div>
                                <div className="flex items-center space-x-2">
                                <Checkbox id="studiedOutsideCountryPromo" checked={studiedOutsideCountry} onCheckedChange={(checked) => setStudiedOutsideCountry(checked as boolean)} disabled={isSubmitting || !!eligibilityError} />
                                <Label htmlFor="studiedOutsideCountryPromo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Employee studied outside the country? (Requires TCU Form)
                                </Label>
                                </div>
                                {studiedOutsideCountry && (
                                <div>
                                    <Label htmlFor="tcuFormFilePromo" className="flex items-center"><ChevronsUpDown className="mr-2 h-4 w-4 text-primary" />Upload TCU Form</Label>
                                    <Input id="tcuFormFilePromo" type="file" onChange={(e) => setTcuFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                                </div>
                                )}
                            </>
                        )}
                        <div>
                            <Label htmlFor="letterOfRequestPromo" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                            <Input id="letterOfRequestPromo" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                        </div>
                    </div>
                )}
              </div>
            )}
          </CardContent>
          {employeeDetails && promotionRequestType && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                <Button onClick={handleSubmitPromotionRequest} disabled={isSubmitDisabled()}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Promotion Request
                </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {(role === ROLES.HHRMD || role === ROLES.HRMO) && ( 
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Promotion Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending promotion requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Promotion for: {request.employee.name} (ZanID: {request.employee.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Type: {request.promotionType}</p>
                  <p className="text-sm text-muted-foreground">Current Cadre: {request.employee.cadre}</p>
                  <p className="text-sm text-muted-foreground">Proposed Grade: {request.proposedCadre}</p>
                  <p className="text-sm text-muted-foreground">Submitted: {format(parseISO(request.createdAt), 'PPP')} by {request.submittedBy.name}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{request.status}</span></p>
                  {request.rejectionReason && <p className="text-sm text-destructive"><span className="font-medium">Rejection Reason:</span> {request.rejectionReason}</p>}
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(request); setIsDetailsModalOpen(true); }}>View Details</Button>
                    
                    {request.reviewStage === 'initial' && request.status.startsWith(`Pending ${role} Review`) && (
                      <>
                        <Button size="sm" onClick={() => handleInitialAction(request.id, 'forward')}>Verify &amp; Forward to Commission</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleInitialAction(request.id, 'reject')}>Reject &amp; Return to HRO</Button>
                      </>
                    )}
                    {request.reviewStage === 'commission_review' && request.status === 'Request Received – Awaiting Commission Decision' && (
                        <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleCommissionDecision(request.id, 'approved')}>Approved by Commission</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleCommissionDecision(request.id, 'rejected')}>Rejected by Commission</Button>
                        </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No promotion requests pending your review.</p>
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
                Promotion request for <strong>{selectedRequest.employee.name}</strong> (ZanID: {selectedRequest.employee.zanId}).
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
                        <Label className="text-right text-muted-foreground">Current Cadre:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.cadre}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Employment Date:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.employmentDate ? format(parseISO(selectedRequest.employee.employmentDate.toString()), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Date of Birth:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.dateOfBirth ? format(parseISO(selectedRequest.employee.dateOfBirth.toString()), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Institution:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.employee.institution?.name || 'N/A'}</p>
                    </div>
                </div>
                <div className="space-y-1">
                     <h4 className="font-semibold text-base text-foreground mb-2">Request Information</h4>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Promotion Type:</Label>
                        <p className="col-span-2">{selectedRequest.promotionType}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Proposed Grade:</Label>
                        <p className="col-span-2">{selectedRequest.proposedCadre}</p>
                    </div>
                    {selectedRequest.promotionType === 'EducationAdvancement' && (
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                            <Label className="text-right font-semibold">Studied Outside?:</Label>
                            <p className="col-span-2">{selectedRequest.studiedOutsideCountry ? 'Yes' : 'No'}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Submitted:</Label>
                        <p className="col-span-2">{format(parseISO(selectedRequest.createdAt), 'PPP')} by {selectedRequest.submittedBy.name}</p>
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
                    <DialogTitle>Reject Promotion Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the promotion request for <strong>{currentRequestToAction.employee.name}</strong> ({currentRequestToAction.promotionType}). This reason will be visible to the HRO.
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
