
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

interface MockPendingRetirementRequest {
  id: string;
  employeeName: string;
  zanId: string;
  retirementType: string;
  proposedDate: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
}

const mockPendingRetirementRequests: MockPendingRetirementRequest[] = [
  {
    id: 'RETIRE001',
    employeeName: 'Hamid Khalfan Abdalla', 
    zanId: '778901234',
    retirementType: 'Compulsory (Age 60)',
    proposedDate: '2025-03-25',
    submissionDate: '2024-07-30',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Letter of Request', 'Birth Certificate Copy'],
  },
  {
    id: 'RETIRE002',
    employeeName: 'Juma Omar Ali', 
    zanId: '667890456',
    retirementType: 'Voluntary (Age 55+)',
    proposedDate: '2025-06-18',
    submissionDate: '2024-07-28',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    documents: ['Letter of Request', 'Service Record Summary'],
  },
  {
    id: 'RETIRE003',
    employeeName: 'Asha Juma Khalfan', 
    zanId: 'ASHA_ZANID_PLACEHOLDER', 
    retirementType: 'Illness',
    proposedDate: '2025-01-15',
    submissionDate: '2024-07-22',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    documents: ['Medical Form', 'Leave Due to Illness Letter', 'Letter of Request'],
  },
];

const COMPULSORY_RETIREMENT_AGE = 60;
const VOLUNTARY_RETIREMENT_AGE = 55;

export default function RetirementPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [retirementType, setRetirementType] = useState('');
  const [retirementDate, setRetirementDate] = useState('');
  const [medicalFormFile, setMedicalFormFile] = useState<FileList | null>(null);
  const [illnessLeaveLetterFile, setIllnessLeaveLetterFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [minRetirementDate, setMinRetirementDate] = useState('');
  const [ageEligibilityError, setAgeEligibilityError] = useState<string | null>(null);

  const [selectedRequest, setSelectedRequest] = useState<MockPendingRetirementRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    const sixMonthsFromNow = addMonths(new Date(), 6);
    setMinRetirementDate(format(sixMonthsFromNow, 'yyyy-MM-dd'));
  }, []);

  useEffect(() => {
    setAgeEligibilityError(null); // Reset error on change
    if (employeeDetails && employeeDetails.dateOfBirth && retirementType && retirementDate) {
      const birthDate = parseISO(employeeDetails.dateOfBirth);
      const proposedRetirementDate = parseISO(retirementDate);
      const ageAtRetirement = differenceInYears(proposedRetirementDate, birthDate);

      if (retirementType === 'compulsory' && ageAtRetirement < COMPULSORY_RETIREMENT_AGE) {
        setAgeEligibilityError(`Employee will be ${ageAtRetirement} and not meet the compulsory retirement age (${COMPULSORY_RETIREMENT_AGE}) by the proposed date. Retirement request cannot be submitted.`);
      } else if (retirementType === 'voluntary' && ageAtRetirement < VOLUNTARY_RETIREMENT_AGE) {
        setAgeEligibilityError(`Employee will be ${ageAtRetirement} and not meet the voluntary retirement age (${VOLUNTARY_RETIREMENT_AGE}) by the proposed date. Retirement request cannot be submitted.`);
      }
    }
  }, [employeeDetails, retirementType, retirementDate]);

  const resetFormFields = () => {
    setRetirementType('');
    setRetirementDate('');
    setMedicalFormFile(null);
    setIllnessLeaveLetterFile(null);
    setLetterOfRequestFile(null);
    setAgeEligibilityError(null);
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

    if (employeeDetails.dateOfBirth && retirementType && retirementDate) {
        const birthDate = parseISO(employeeDetails.dateOfBirth);
        const proposedRetirementDateObj = parseISO(retirementDate);
        const ageAtRetirement = differenceInYears(proposedRetirementDateObj, birthDate);

        if (retirementType === 'compulsory' && ageAtRetirement < COMPULSORY_RETIREMENT_AGE) {
            toast({ title: "Submission Error", description: `Employee will be ${ageAtRetirement} and not meet the compulsory retirement age (${COMPULSORY_RETIREMENT_AGE}) by the proposed date. Retirement request cannot be submitted.`, variant: "destructive", duration: 7000 });
            return;
        }
        if (retirementType === 'voluntary' && ageAtRetirement < VOLUNTARY_RETIREMENT_AGE) {
            toast({ title: "Submission Error", description: `Employee will be ${ageAtRetirement} and not meet the voluntary retirement age (${VOLUNTARY_RETIREMENT_AGE}) by the proposed date. Retirement request cannot be submitted.`, variant: "destructive", duration: 7000 });
            return;
        }
    } else if (retirementType !== 'illness' && !employeeDetails.dateOfBirth) {
        toast({ title: "Submission Error", description: "Employee date of birth is missing. Cannot validate retirement age.", variant: "destructive", duration: 7000 });
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
      if (!medicalFormFile) {
        toast({ title: "Submission Error", description: "Medical Form is missing for illness retirement. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (!illnessLeaveLetterFile) {
        toast({ title: "Submission Error", description: "Leave Due to Illness Letter is missing for illness retirement. Please upload the PDF document.", variant: "destructive" });
        return;
      }
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";

    if (!checkPdf(letterOfRequestFile)) {
      toast({ title: "Submission Error", description: "Letter of Request must be a PDF file.", variant: "destructive" });
      return;
    }
    if (retirementType === 'illness') {
      if (medicalFormFile && !checkPdf(medicalFormFile)) {
        toast({ title: "Submission Error", description: "Medical Form must be a PDF file.", variant: "destructive" });
        return;
      }
      if (illnessLeaveLetterFile && !checkPdf(illnessLeaveLetterFile)) {
        toast({ title: "Submission Error", description: "Leave Due to Illness Letter must be a PDF file.", variant: "destructive" });
        return;
      }
    }
    
    setIsSubmitting(true);
    console.log("Submitting Retirement Request:", {
      employee: employeeDetails,
      retirementType,
      retirementDate,
      medicalFormFile: medicalFormFile ? medicalFormFile[0]?.name : null,
      illnessLeaveLetterFile: illnessLeaveLetterFile ? illnessLeaveLetterFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
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
    (retirementType === 'illness' && (!medicalFormFile || !illnessLeaveLetterFile)) || 
    isSubmitting ||
    !!ageEligibilityError;

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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div><Label className="text-muted-foreground">Name:</Label> <p className="font-semibold text-foreground">{employeeDetails.name}</p></div>
                      <div><Label className="text-muted-foreground">ZanID:</Label> <p className="font-semibold text-foreground">{employeeDetails.zanId}</p></div>
                      <div><Label className="text-muted-foreground">Department:</Label> <p className="font-semibold text-foreground">{employeeDetails.department || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Cadre:</Label> <p className="font-semibold text-foreground">{employeeDetails.cadre || 'N/A'}</p></div>
                       <div><Label className="text-muted-foreground">Date of Birth:</Label> <p className="font-semibold text-foreground">{employeeDetails.dateOfBirth ? format(parseISO(employeeDetails.dateOfBirth), 'PPP') : 'N/A'}</p></div>
                    </div>
                  </div>
                </div>

                 {ageEligibilityError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Age Eligibility Error</AlertTitle>
                    <AlertDescription>{ageEligibilityError}</AlertDescription>
                  </Alert>
                )}


                <div className={`space-y-4 ${!!ageEligibilityError ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <h3 className="text-lg font-medium text-foreground">Retirement Details & Documents (PDF Only)</h3>
                  <div>
                    <Label htmlFor="retirementType" className="flex items-center"><ListFilter className="mr-2 h-4 w-4 text-primary" />Retirement Type</Label>
                    <Select value={retirementType} onValueChange={setRetirementType} disabled={isSubmitting || !!ageEligibilityError}>
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
                    <Input id="retirementDate" type="date" value={retirementDate} onChange={(e) => setRetirementDate(e.target.value)} disabled={isSubmitting || !!ageEligibilityError} min={minRetirementDate} />
                  </div>
                  
                  {retirementType === 'illness' && (
                    <>
                      <div>
                        <Label htmlFor="medicalFormFile" className="flex items-center"><Stethoscope className="mr-2 h-4 w-4 text-primary" />Upload Medical Form</Label>
                        <Input id="medicalFormFile" type="file" onChange={(e) => setMedicalFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!ageEligibilityError}/>
                      </div>
                      <div>
                        <Label htmlFor="illnessLeaveLetterFile" className="flex items-center"><ClipboardCheck className="mr-2 h-4 w-4 text-primary" />Upload Leave Due to Illness Letter</Label>
                        <Input id="illnessLeaveLetterFile" type="file" onChange={(e) => setIllnessLeaveLetterFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!ageEligibilityError}/>
                      </div>
                    </>
                  )}

                  <div>
                    <Label htmlFor="letterOfRequestRetirement" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                    <Input id="letterOfRequestRetirement" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!ageEligibilityError}/>
                  </div>
                   <p className="text-xs text-muted-foreground">
                    Note: Proposed retirement date must be at least 6 months from today. Age validation based on Date of Birth for Compulsory/Voluntary retirement will be checked against the proposed retirement date.
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
            {mockPendingRetirementRequests.length > 0 ? (
              mockPendingRetirementRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Retirement Request for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Type: {request.retirementType}</p>
                  <p className="text-sm text-muted-foreground">Proposed Date: {request.proposedDate}</p>
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
              <p className="text-muted-foreground">No retirement requests pending review.</p>
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
            <div className="grid gap-4 py-4 text-sm">
              <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                <Label className="text-right font-semibold">Retirement Type:</Label>
                <p className="col-span-2">{selectedRequest.retirementType}</p>
              </div>
              <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                <Label className="text-right font-semibold">Proposed Date:</Label>
                <p className="col-span-2">{selectedRequest.proposedDate}</p>
              </div>
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
                    <p className="text-muted-foreground">No documents listed.</p>
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
    </div>
  );
}

