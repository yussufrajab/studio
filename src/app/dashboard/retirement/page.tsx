
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, CalendarDays, ListFilter, Stethoscope, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { addMonths, format, isBefore, differenceInYears, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from '@/components/ui/textarea';

interface MockPendingRetirementRequest {
  id: string;
  employeeName: string;
  zanId: string;
  department: string;
  cadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  retirementType: string;
  illnessDescription?: string;
  proposedDate: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: string;
  delayReason?: string;
}

const initialMockPendingRetirementRequests: MockPendingRetirementRequest[] = [
  {
    id: 'RETIRE001',
    employeeName: 'Hamid Khalfan Abdalla', 
    zanId: '778901234',
    department: 'Transport',
    cadre: 'Senior Driver',
    employmentDate: '2010-01-01',
    dateOfBirth: '1965-03-25', 
    institution: 'Government Garage',
    retirementType: 'Compulsory (Age 60)',
    proposedDate: '2025-03-25',
    submissionDate: '2024-07-30',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Letter of Request', 'Birth Certificate Copy'],
    reviewStage: 'initial',
  },
  {
    id: 'RETIRE002',
    employeeName: 'Juma Omar Ali', 
    zanId: '667890456',
    department: 'Procurement',
    cadre: 'Procurement Officer',
    employmentDate: '2015-10-11',
    dateOfBirth: '1970-06-18', 
    institution: 'Government Procurement Services Agency',
    retirementType: 'Voluntary (Age 55+)',
    proposedDate: '2025-06-18',
    submissionDate: '2024-07-28',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    documents: ['Letter of Request', 'Service Record Summary'],
    reviewStage: 'initial',
  },
  {
    id: 'RETIRE003',
    employeeName: 'Asha Juma Khalfan', 
    zanId: '889012345',
    department: 'Education',
    cadre: 'Teacher',
    employmentDate: '2005-05-05',
    dateOfBirth: '1970-12-12',
    institution: 'Ministry of Education',
    retirementType: 'Illness',
    illnessDescription: 'Severe arthritis affecting mobility and ability to perform duties.',
    proposedDate: '2025-01-15',
    submissionDate: '2024-07-22',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Medical Form', 'Leave Due to Illness Letter', 'Letter of Request'],
    reviewStage: 'initial',
  },
];

const COMPULSORY_RETIREMENT_AGE = 60;
const VOLUNTARY_RETIREMENT_AGE = 55;

export default function RetirementPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [retirementType, setRetirementType] = useState('');
  const [retirementDate, setRetirementDate] = useState('');
  const [illnessDescription, setIllnessDescription] = useState('');
  const [medicalFormFile, setMedicalFormFile] = useState<FileList | null>(null);
  const [illnessLeaveLetterFile, setIllnessLeaveLetterFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [minRetirementDate, setMinRetirementDate] = useState('');
  const [ageEligibilityError, setAgeEligibilityError] = useState<string | null>(null);

  const [delayReason, setDelayReason] = useState('');
  const [delayDocumentFile, setDelayDocumentFile] = useState<FileList | null>(null);
  const [showDelayFields, setShowDelayFields] = useState(false);

  const [pendingRequests, setPendingRequests] = useState<MockPendingRetirementRequest[]>(initialMockPendingRetirementRequests);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingRetirementRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockPendingRetirementRequest | null>(null);

  useEffect(() => {
    const sixMonthsFromNow = addMonths(new Date(), 6);
    setMinRetirementDate(format(sixMonthsFromNow, 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    setAgeEligibilityError(null);
    setShowDelayFields(false);

    if (employeeDetails && employeeDetails.dateOfBirth && retirementType && retirementDate) {
      const birthDate = parseISO(employeeDetails.dateOfBirth);
      const proposedRetirementDate = parseISO(retirementDate);
      const ageAtRetirement = differenceInYears(proposedRetirementDate, birthDate);

      if (retirementType === 'compulsory') {
        if (ageAtRetirement > COMPULSORY_RETIREMENT_AGE) {
          setShowDelayFields(true);
        } else if (ageAtRetirement < COMPULSORY_RETIREMENT_AGE) {
          setAgeEligibilityError(`Employee will be ${ageAtRetirement} and not meet the compulsory retirement age (${COMPULSORY_RETIREMENT_AGE}) by the proposed date.`);
        }
      } else if (retirementType === 'voluntary') {
        if (ageAtRetirement >= COMPULSORY_RETIREMENT_AGE) {
          setAgeEligibilityError(`Employee is aged ${ageAtRetirement} and qualifies for compulsory retirement. Please select 'Compulsory (Age 60)' as the retirement type.`);
        } else if (ageAtRetirement < VOLUNTARY_RETIREMENT_AGE) {
          setAgeEligibilityError(`Employee will be ${ageAtRetirement} and not meet the voluntary retirement age (${VOLUNTARY_RETIREMENT_AGE}) by the proposed date.`);
        }
      }
    }
  }, [employeeDetails, retirementType, retirementDate]);

  const resetFormFields = () => {
    setRetirementType('');
    setRetirementDate('');
    setIllnessDescription('');
    setMedicalFormFile(null);
    setIllnessLeaveLetterFile(null);
    setLetterOfRequestFile(null);
    setAgeEligibilityError(null);
    setDelayReason('');
    setDelayDocumentFile(null);
    setShowDelayFields(false);
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
        if (!foundEmployee.dateOfBirth) {
            toast({ title: "Missing Information", description: "Employee date of birth is missing. Age validation cannot be performed.", variant: "warning", duration: 5000 });
        }
        toast({ title: "Employee Found", description: `Details for ${foundEmployee.name} loaded.` });
      } else {
        toast({ title: "Employee Not Found", description: `No employee found with ZanID: ${zanId}.`, variant: "destructive" });
      }
      setIsFetchingEmployee(false);
    }, 1000);
  };

  const handleSubmitRetirementRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!retirementType) {
      toast({ title: "Submission Error", description: "Retirement Type is required.", variant: "destructive" });
      return;
    }
    if (!retirementDate) {
      toast({ title: "Submission Error", description: "Proposed Retirement Date is required.", variant: "destructive" });
      return;
    }
    if (ageEligibilityError && !showDelayFields) {
      toast({ title: "Submission Error", description: ageEligibilityError, variant: "destructive", duration: 7000 });
      return;
    }
    
    const proposedDateObj = parseISO(retirementDate);
    const sixMonthsFromToday = addMonths(new Date(), 6);
    sixMonthsFromToday.setHours(0, 0, 0, 0); 

    if (isBefore(proposedDateObj, sixMonthsFromToday)) {
      toast({ title: "Submission Error", description: "Proposed retirement date must be at least 6 months from today.", variant: "destructive" });
      return;
    }

    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (retirementType === 'illness') {
      if (!illnessDescription) {
        toast({ title: "Submission Error", description: "Type of Illness is required for illness retirement.", variant: "destructive" });
        return;
      }
      if (!medicalFormFile) {
        toast({ title: "Submission Error", description: "Medical Form is missing for illness retirement. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (!illnessLeaveLetterFile) {
        toast({ title: "Submission Error", description: "Leave Due to Illness Letter is missing for illness retirement. Please upload the PDF document.", variant: "destructive" });
        return;
      }
    }
    if (showDelayFields) {
        if (!delayReason.trim()) {
            toast({ title: "Submission Error", description: "A reason for the submission delay is required.", variant: "destructive" });
            return;
        }
        if (!delayDocumentFile) {
            toast({ title: "Submission Error", description: "A supporting document for the delay is required.", variant: "destructive" });
            return;
        }
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";

    if (!checkPdf(letterOfRequestFile) || (medicalFormFile && !checkPdf(medicalFormFile)) || (illnessLeaveLetterFile && !checkPdf(illnessLeaveLetterFile)) || (delayDocumentFile && !checkPdf(delayDocumentFile))) {
      toast({ title: "Submission Error", description: "All uploaded documents must be PDF files.", variant: "destructive" });
      return;
    }
    
    setIsSubmitting(true);
    let documentsList = ['Letter of Request'];
    if (retirementType === 'illness') {
        documentsList.push('Medical Form', 'Leave Due to Illness Letter');
    } else if (retirementType === 'compulsory') {
        documentsList.push('Birth Certificate Copy (or equivalent)');
    } else if (retirementType === 'voluntary') {
        documentsList.push('Service Record Summary');
    }
    if (showDelayFields) {
        documentsList.push('Delay Justification Document');
    }

    const newRequestId = `RET${Date.now().toString().slice(-3)}`;
    const newRequest: MockPendingRetirementRequest = {
        id: newRequestId,
        employeeName: employeeDetails.name,
        zanId: employeeDetails.zanId,
        department: employeeDetails.department || 'N/A',
        cadre: employeeDetails.cadre || 'N/A',
        employmentDate: employeeDetails.employmentDate || 'N/A',
        dateOfBirth: employeeDetails.dateOfBirth || 'N/A',
        institution: employeeDetails.institution || 'N/A',
        retirementType: retirementType,
        illnessDescription: retirementType === 'illness' ? illnessDescription : undefined,
        delayReason: showDelayFields ? delayReason : undefined,
        proposedDate: retirementDate,
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        submittedBy: `${user?.name} (${user?.role})`,
        status: role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending HRMO Review',
        documents: documentsList,
        reviewStage: 'initial',
    };

    console.log("Submitting Retirement Request:", newRequest);

    setTimeout(() => {
      setPendingRequests(prev => [newRequest, ...prev]);
      toast({ title: "Retirement Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
  };
  
  const isSubmitDisabled = 
    !employeeDetails || 
    !retirementType || 
    !retirementDate || 
    !letterOfRequestFile || 
    (retirementType === 'illness' && (!medicalFormFile || !illnessLeaveLetterFile || !illnessDescription)) || 
    (showDelayFields && (!delayReason.trim() || !delayDocumentFile)) ||
    (ageEligibilityError && !showDelayFields) ||
    isSubmitting;

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
      <PageHeader title="Retirement" description="Manage employee retirement processes." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Retirement Request</CardTitle>
            <CardDescription>Enter ZanID, then fill retirement details and upload required PDF documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdRetirement">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdRetirement" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
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

                 {ageEligibilityError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Eligibility Error</AlertTitle>
                    <AlertDescription>{ageEligibilityError}</AlertDescription>
                  </Alert>
                )}

                <div className={`space-y-4 ${ageEligibilityError && !showDelayFields ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <h3 className="text-lg font-medium text-foreground">Retirement Details &amp; Documents (PDF Only)</h3>
                  <div>
                    <Label htmlFor="retirementType" className="flex items-center"><ListFilter className="mr-2 h-4 w-4 text-primary" />Retirement Type</Label>
                    <Select value={retirementType} onValueChange={setRetirementType} disabled={isSubmitting || (ageEligibilityError && !showDelayFields)}>
                      <SelectTrigger id="retirementTypeTrigger">
                        <SelectValue placeholder="Select retirement type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compulsory">Compulsory (Age 60)</SelectItem>
                        <SelectItem value="voluntary">Voluntary (Age 55+)</SelectItem>
                        <SelectItem value="illness">Illness</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="retirementDate" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary" />Proposed Retirement Date</Label>
                    <Input id="retirementDate" type="date" value={retirementDate} onChange={(e) => setRetirementDate(e.target.value)} disabled={isSubmitting || (ageEligibilityError && !showDelayFields)} min={minRetirementDate} />
                  </div>
                  
                  {retirementType === 'illness' && (
                    <>
                      <div>
                        <Label htmlFor="illnessDescription">Type of Illness</Label>
                        <Textarea 
                          id="illnessDescription" 
                          placeholder="Describe the illness as per the medical report" 
                          value={illnessDescription} 
                          onChange={(e) => setIllnessDescription(e.target.value)} 
                          disabled={isSubmitting || (ageEligibilityError && !showDelayFields)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="medicalFormFile" className="flex items-center"><Stethoscope className="mr-2 h-4 w-4 text-primary" />Upload Medical Form</Label>
                        <Input id="medicalFormFile" type="file" onChange={(e) => setMedicalFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting || (ageEligibilityError && !showDelayFields)}/>
                      </div>
                      <div>
                        <Label htmlFor="illnessLeaveLetterFile" className="flex items-center"><ClipboardCheck className="mr-2 h-4 w-4 text-primary" />Upload Leave Due to Illness Letter</Label>
                        <Input id="illnessLeaveLetterFile" type="file" onChange={(e) => setIllnessLeaveLetterFile(e.target.files)} accept=".pdf" disabled={isSubmitting || (ageEligibilityError && !showDelayFields)}/>
                      </div>
                    </>
                  )}
                  
                  {showDelayFields && (
                    <div className="space-y-4 pt-2 border-t border-yellow-300">
                      <Alert variant="default" className="bg-yellow-50 border-yellow-300 text-yellow-800">
                        <AlertTriangle className="h-4 w-4 !text-yellow-800" />
                        <AlertTitle>Delayed Compulsory Retirement</AlertTitle>
                        <AlertDescription>
                          This employee is over {COMPULSORY_RETIREMENT_AGE}. Please provide a reason for the delay and upload a supporting document.
                        </AlertDescription>
                      </Alert>
                      <div>
                        <Label htmlFor="delayReason">Reason for Delay</Label>
                        <Textarea
                          id="delayReason"
                          placeholder="e.g., The employee was granted a service extension."
                          value={delayReason}
                          onChange={(e) => setDelayReason(e.target.value)}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div>
                        <Label htmlFor="delayDocumentFile" className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-primary" />
                          Upload Supporting Document for Delay (e.g., Extension Letter)
                        </Label>
                        <Input id="delayDocumentFile" type="file" onChange={(e) => setDelayDocumentFile(e.target.files)} accept=".pdf" disabled={isSubmitting} />
                      </div>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="letterOfRequestRetirement" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                    <Input id="letterOfRequestRetirement" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting || (ageEligibilityError && !showDelayFields)}/>
                  </div>
                   <p className="text-xs text-muted-foreground">
                    Note: Proposed retirement date must be at least 6 months from today. Age validation is based on the proposed retirement date.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
              <Button 
                onClick={handleSubmitRetirementRequest} 
                disabled={isSubmitDisabled}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Retirement Request
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
      {(role === ROLES.HHRMD || role === ROLES.HRMO) && ( 
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Retirement Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending retirement requests.</CardDescription>
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
                  <h3 className="font-semibold text-base">Retirement Request for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Type: {request.retirementType}</p>
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
              <p className="text-muted-foreground">No retirement requests pending your review.</p>
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
                Retirement request for <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
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
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Retirement Type:</Label>
                        <p className="col-span-2">{selectedRequest.retirementType}</p>
                    </div>
                    {selectedRequest.retirementType === 'Illness' && selectedRequest.illnessDescription && (
                        <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                            <Label className="text-right font-semibold pt-1">Type of Illness:</Label>
                            <p className="col-span-2">{selectedRequest.illnessDescription}</p>
                        </div>
                    )}
                    {selectedRequest.delayReason && (
                        <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                            <Label className="text-right font-semibold text-yellow-700 pt-1">Reason for Delay:</Label>
                            <p className="col-span-2">{selectedRequest.delayReason}</p>
                        </div>
                    )}
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
                    <DialogTitle>Reject Retirement Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the retirement request for <strong>{currentRequestToAction.employeeName}</strong>. This reason will be visible to the HRO.
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
