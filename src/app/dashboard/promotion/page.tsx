
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, Award, ChevronsUpDown, ListFilter, Star, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parseISO, differenceInYears } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface MockPendingPromotionRequest {
  id: string;
  employeeName: string;
  zanId: string;
  department: string;
  currentCadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  proposedCadre: string;
  promotionType: 'Experience' | 'Education Advancement';
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
  studiedOutsideCountry?: boolean;
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: string;
}

const initialMockPendingPromotionRequests: MockPendingPromotionRequest[] = [
  {
    id: 'PROM001',
    employeeName: 'Zainab Ali Khamis',
    zanId: '556789345',
    department: 'Planning',
    currentCadre: 'Planning Officer',
    employmentDate: "2022-02-01",
    dateOfBirth: "1992-12-30",
    institution: "Planning Commission",
    proposedCadre: 'Senior Planning Officer',
    promotionType: 'Experience',
    submissionDate: '2024-07-29',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Performance Appraisal Form (Year 1)', 'Performance Appraisal Form (Year 2)', 'Performance Appraisal Form (Year 3)', 'Civil Service Commission Promotion Form', 'Letter of Request'],
    reviewStage: 'initial',
  },
  {
    id: 'PROM002',
    employeeName: 'Juma Omar Ali',
    zanId: '667890456',
    department: 'Procurement',
    currentCadre: 'Procurement Officer',
    employmentDate: "2015-10-11",
    dateOfBirth: "1983-06-18",
    institution: "Government Procurement Services Agency",
    proposedCadre: 'Principal Procurement Officer',
    promotionType: 'Education Advancement',
    submissionDate: '2024-07-26',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    documents: ['Academic Certificate (Masters)', 'TCU Form', 'Letter of Request'],
    studiedOutsideCountry: true,
    reviewStage: 'initial',
  },
];

export default function PromotionPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const [pendingRequests, setPendingRequests] = useState<MockPendingPromotionRequest[]>(initialMockPendingPromotionRequests);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingPromotionRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockPendingPromotionRequest | null>(null);

  const [eligibilityError, setEligibilityError] = useState<string | null>(null);


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

  const handleFetchEmployeeDetails = () => {
    if (!zanId) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID.", variant: "destructive" });
      return;
    }
    setIsFetchingEmployee(true);
    setEmployeeDetails(null);
    resetFormFields();
    setEligibilityError(null);

    setTimeout(() => {
      const foundEmployee = EMPLOYEES.find(emp => emp.zanId === zanId);
      if (foundEmployee) {
        let error = null;
        if (foundEmployee.status === 'On Probation' || foundEmployee.status === 'On LWOP') {
          error = `Employee is currently '${foundEmployee.status}' and is not eligible for promotion.`;
        } else if (foundEmployee.employmentDate) {
          const yearsOfService = differenceInYears(new Date(), parseISO(foundEmployee.employmentDate));
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
      } else {
        toast({ title: "Employee Not Found", description: `No employee found with ZanID: ${zanId}.`, variant: "destructive" });
      }
      setIsFetchingEmployee(false);
    }, 1000);
  };

  const handleSubmitPromotionRequest = () => {
    if (!!eligibilityError) {
      toast({ title: "Submission Error", description: "This employee is ineligible for promotion.", variant: "destructive" });
      return;
    }
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!promotionRequestType) {
      toast({ title: "Submission Error", description: "Please select a Promotion Type.", variant: "destructive" });
      return;
    }
    if (promotionRequestType === 'experience' && !proposedCadre) {
      toast({ title: "Submission Error", description: "Proposed New Grade is required.", variant: "destructive" });
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

    let submissionData: any = {
      employee: employeeDetails,
      promotionType: promotionRequestType,
      proposedCadre,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    };
    let documentsList: string[] = ['Letter of Request'];


    if (promotionRequestType === 'experience') {
      if (!performanceAppraisalFileY1) {
        toast({ title: "Submission Error", description: "Performance Appraisal Form (Year 1) is missing. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (!checkPdf(performanceAppraisalFileY1)) {
        toast({ title: "Submission Error", description: "Performance Appraisal Form (Year 1) must be a PDF file.", variant: "destructive" });
        return;
      }
      if (!performanceAppraisalFileY2) {
        toast({ title: "Submission Error", description: "Performance Appraisal Form (Year 2) is missing. Please upload the PDF document.", variant: "destructive" });
        return;
      }
       if (!checkPdf(performanceAppraisalFileY2)) {
        toast({ title: "Submission Error", description: "Performance Appraisal Form (Year 2) must be a PDF file.", variant: "destructive" });
        return;
      }
      if (!performanceAppraisalFileY3) {
        toast({ title: "Submission Error", description: "Performance Appraisal Form (Year 3) is missing. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (!checkPdf(performanceAppraisalFileY3)) {
        toast({ title: "Submission Error", description: "Performance Appraisal Form (Year 3) must be a PDF file.", variant: "destructive" });
        return;
      }
      if (!cscPromotionFormFile) {
        toast({ title: "Submission Error", description: "Civil Service Commission Promotion Form is missing. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (!checkPdf(cscPromotionFormFile)) {
        toast({ title: "Submission Error", description: "Civil Service Commission Promotion Form must be a PDF file.", variant: "destructive" });
        return;
      }
      documentsList.push('Performance Appraisal (Y1)', 'Performance Appraisal (Y2)', 'Performance Appraisal (Y3)', 'CSC Promotion Form');
      submissionData = {
        ...submissionData,
        performanceAppraisalFileY1: performanceAppraisalFileY1[0]?.name,
        performanceAppraisalFileY2: performanceAppraisalFileY2[0]?.name,
        performanceAppraisalFileY3: performanceAppraisalFileY3[0]?.name,
        cscPromotionFormFile: cscPromotionFormFile[0]?.name,
      };
    } else if (promotionRequestType === 'education') {
      if (!certificateFile) {
        toast({ title: "Submission Error", description: "Academic Certificate is missing. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (!checkPdf(certificateFile)) {
        toast({ title: "Submission Error", description: "Academic Certificate must be a PDF file.", variant: "destructive" });
        return;
      }
      documentsList.push('Academic Certificate');
      if (studiedOutsideCountry && !tcuFormFile) {
        toast({ title: "Submission Error", description: "TCU Form is missing as employee studied outside the country. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (studiedOutsideCountry && tcuFormFile && !checkPdf(tcuFormFile)) {
        toast({ title: "Submission Error", description: "TCU Form must be a PDF file.", variant: "destructive" });
        return;
      }
      if (studiedOutsideCountry) documentsList.push('TCU Form');
      submissionData = {
        ...submissionData,
        certificateFile: certificateFile[0]?.name,
        studiedOutsideCountry,
        tcuFormFile: tcuFormFile ? tcuFormFile[0]?.name : null,
      };
    }

    setIsSubmitting(true);
    const newRequestId = `PROM${Date.now().toString().slice(-3)}`;
    const newRequest: MockPendingPromotionRequest = {
        id: newRequestId,
        employeeName: employeeDetails.name,
        zanId: employeeDetails.zanId,
        department: employeeDetails.department || 'N/A',
        currentCadre: employeeDetails.cadre || 'N/A',
        employmentDate: employeeDetails.employmentDate || 'N/A',
        dateOfBirth: employeeDetails.dateOfBirth || 'N/A',
        institution: employeeDetails.institution || 'N/A',
        proposedCadre: proposedCadre,
        promotionType: promotionRequestType === 'experience' ? 'Experience' : 'Education Advancement',
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        submittedBy: `${user?.name} (${user?.role})`,
        status: role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending HRMO Review',
        documents: documentsList,
        studiedOutsideCountry: promotionRequestType === 'education' ? studiedOutsideCountry : undefined,
        reviewStage: 'initial',
    };
    console.log("Submitting Promotion Request:", submissionData);

    setTimeout(() => {
      setPendingRequests(prev => [newRequest, ...prev]);
      toast({ title: "Promotion Request Submitted", description: `Promotion request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
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
    
    return true; // Should not happen if a promotion type is selected
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
                      <div><Label className="text-muted-foreground">Employment Date:</Label> <p className="font-semibold text-foreground">{employeeDetails.employmentDate ? format(parseISO(employeeDetails.employmentDate), 'PPP') : 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Date of Birth:</Label> <p className="font-semibold text-foreground">{employeeDetails.dateOfBirth ? format(parseISO(employeeDetails.dateOfBirth), 'PPP') : 'N/A'}</p></div>
                      <div className="lg:col-span-1"><Label className="text-muted-foreground">Institution:</Label> <p className="font-semibold text-foreground">{employeeDetails.institution || 'N/A'}</p></div>
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
            {pendingRequests.filter(req => 
                (role === ROLES.HHRMD && req.status === 'Pending HHRMD Review') ||
                (role === ROLES.HRMO && req.status === 'Pending HRMO Review') ||
                req.status === 'Request Received – Awaiting Commission Decision' ||
                req.status.startsWith('Rejected by') || req.status.startsWith('Approved by') 
            ).length > 0 ? (
              pendingRequests.filter(req => 
                (role === ROLES.HHRMD && req.status === 'Pending HHRMD Review') ||
                (role === ROLES.HRMO && req.status === 'Pending HRMO Review') ||
                req.status === 'Request Received – Awaiting Commission Decision' ||
                req.status.startsWith('Rejected by') || req.status.startsWith('Approved by')
              ).map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Promotion for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Type: {request.promotionType}</p>
                  <p className="text-sm text-muted-foreground">Current Cadre: {request.currentCadre}</p>
                  <p className="text-sm text-muted-foreground">Proposed Grade: {request.proposedCadre}</p>
                  <p className="text-sm text-muted-foreground">Submitted: {request.submissionDate ? format(parseISO(request.submissionDate), 'PPP') : 'N/A'} by {request.submittedBy}</p>
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
              <p className="text-muted-foreground">No promotion requests pending your review.</p>
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
                Promotion request for <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
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
                        <Label className="text-right text-muted-foreground">Current Cadre:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.currentCadre}</p>
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
                        <Label className="text-right font-semibold">Promotion Type:</Label>
                        <p className="col-span-2">{selectedRequest.promotionType}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Proposed Grade:</Label>
                        <p className="col-span-2">{selectedRequest.proposedCadre}</p>
                    </div>
                    {selectedRequest.promotionType === 'Education Advancement' && (
                        <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                            <Label className="text-right font-semibold">Studied Outside?:</Label>
                            <p className="col-span-2">{selectedRequest.studiedOutsideCountry ? 'Yes' : 'No'}</p>
                        </div>
                    )}
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
                    <DialogTitle>Reject Promotion Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the promotion request for <strong>{currentRequestToAction.employeeName}</strong> ({currentRequestToAction.promotionType}). This reason will be visible to the HRO.
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
