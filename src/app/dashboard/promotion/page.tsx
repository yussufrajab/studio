
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
import { Loader2, Search, FileText, Award, ChevronsUpDown, ListFilter, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';

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
}

const mockPendingPromotionRequests: MockPendingPromotionRequest[] = [
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
  },
];

export default function PromotionPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [promotionType, setPromotionType] = useState<'experience' | 'education' | ''>('');
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

  const [selectedRequest, setSelectedRequest] = useState<MockPendingPromotionRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const resetFormFields = () => {
    setPromotionType('');
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

  const handleSubmitPromotionRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!promotionType) {
      toast({ title: "Submission Error", description: "Please select a Promotion Type.", variant: "destructive" });
      return;
    }
    if (!proposedCadre) {
      toast({ title: "Submission Error", description: "Proposed New Cadre/Position is required.", variant: "destructive" });
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
      promotionType,
      proposedCadre,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    };

    if (promotionType === 'experience') {
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
      submissionData = {
        ...submissionData,
        performanceAppraisalFileY1: performanceAppraisalFileY1[0]?.name,
        performanceAppraisalFileY2: performanceAppraisalFileY2[0]?.name,
        performanceAppraisalFileY3: performanceAppraisalFileY3[0]?.name,
        cscPromotionFormFile: cscPromotionFormFile[0]?.name,
      };
    } else if (promotionType === 'education') {
      if (!certificateFile) {
        toast({ title: "Submission Error", description: "Academic Certificate is missing. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (!checkPdf(certificateFile)) {
        toast({ title: "Submission Error", description: "Academic Certificate must be a PDF file.", variant: "destructive" });
        return;
      }
      if (studiedOutsideCountry && !tcuFormFile) {
        toast({ title: "Submission Error", description: "TCU Form is missing as employee studied outside the country. Please upload the PDF document.", variant: "destructive" });
        return;
      }
      if (studiedOutsideCountry && tcuFormFile && !checkPdf(tcuFormFile)) {
        toast({ title: "Submission Error", description: "TCU Form must be a PDF file.", variant: "destructive" });
        return;
      }
      submissionData = {
        ...submissionData,
        certificateFile: certificateFile[0]?.name,
        studiedOutsideCountry,
        tcuFormFile: tcuFormFile ? tcuFormFile[0]?.name : null,
      };
    }

    setIsSubmitting(true);
    console.log("Submitting Promotion Request:", submissionData);

    setTimeout(() => {
      toast({ title: "Promotion Request Submitted", description: `Promotion request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
  };
  
  const isSubmitDisabled = () => {
    if (!employeeDetails || !promotionType || !proposedCadre || !letterOfRequestFile) return true;
    if (promotionType === 'experience') {
      return !performanceAppraisalFileY1 || !performanceAppraisalFileY2 || !performanceAppraisalFileY3 || !cscPromotionFormFile || isSubmitting;
    }
    if (promotionType === 'education') {
      return !certificateFile || (studiedOutsideCountry && !tcuFormFile) || isSubmitting;
    }
    return true; 
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

                <div className="space-y-2">
                    <Label htmlFor="promotionTypeSelect" className="flex items-center"><ListFilter className="mr-2 h-4 w-4 text-primary" />Promotion Type</Label>
                    <Select value={promotionType} onValueChange={(value) => setPromotionType(value as 'experience' | 'education' | '')} disabled={isSubmitting}>
                      <SelectTrigger id="promotionTypeSelect">
                        <SelectValue placeholder="Select promotion type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="experience">Promotion Based on Experience (Performance)</SelectItem>
                        <SelectItem value="education">Promotion Based on Education Advancement</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
            
                {promotionType && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-foreground">Promotion Details & Documents (PDF Only)</h3>
                        <div>
                            <Label htmlFor="proposedCadre">Proposed New Cadre/Position</Label>
                            <Input id="proposedCadre" placeholder="e.g., Principal Officer" value={proposedCadre} onChange={(e) => setProposedCadre(e.target.value)} disabled={isSubmitting} />
                        </div>

                        {promotionType === 'experience' && (
                            <>
                                <div>
                                <Label htmlFor="performanceAppraisalFileY1" className="flex items-center"><Star className="mr-2 h-4 w-4 text-primary" />Upload Performance Appraisal Form (Year 1)</Label>
                                <Input id="performanceAppraisalFileY1" type="file" onChange={(e) => setPerformanceAppraisalFileY1(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                                </div>
                                <div>
                                <Label htmlFor="performanceAppraisalFileY2" className="flex items-center"><Star className="mr-2 h-4 w-4 text-primary" />Upload Performance Appraisal Form (Year 2)</Label>
                                <Input id="performanceAppraisalFileY2" type="file" onChange={(e) => setPerformanceAppraisalFileY2(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                                </div>
                                <div>
                                <Label htmlFor="performanceAppraisalFileY3" className="flex items-center"><Star className="mr-2 h-4 w-4 text-primary" />Upload Performance Appraisal Form (Year 3)</Label>
                                <Input id="performanceAppraisalFileY3" type="file" onChange={(e) => setPerformanceAppraisalFileY3(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                                </div>
                                <div>
                                <Label htmlFor="cscPromotionFormFile" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Civil Service Commission Promotion Form (Tume ya Utumishi)</Label>
                                <Input id="cscPromotionFormFile" type="file" onChange={(e) => setCscPromotionFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                                </div>
                            </>
                        )}

                        {promotionType === 'education' && (
                            <>
                                <div>
                                <Label htmlFor="certificateFilePromo" className="flex items-center"><Award className="mr-2 h-4 w-4 text-primary" />Upload Academic Certificate</Label>
                                <Input id="certificateFilePromo" type="file" onChange={(e) => setCertificateFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                                </div>
                                <div className="flex items-center space-x-2">
                                <Checkbox id="studiedOutsideCountryPromo" checked={studiedOutsideCountry} onCheckedChange={(checked) => setStudiedOutsideCountry(checked as boolean)} disabled={isSubmitting} />
                                <Label htmlFor="studiedOutsideCountryPromo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Employee studied outside the country? (Requires TCU Form)
                                </Label>
                                </div>
                                {studiedOutsideCountry && (
                                <div>
                                    <Label htmlFor="tcuFormFilePromo" className="flex items-center"><ChevronsUpDown className="mr-2 h-4 w-4 text-primary" />Upload TCU Form</Label>
                                    <Input id="tcuFormFilePromo" type="file" onChange={(e) => setTcuFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                                </div>
                                )}
                            </>
                        )}
                        <div>
                            <Label htmlFor="letterOfRequestPromo" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                            <Input id="letterOfRequestPromo" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                        </div>
                    </div>
                )}
              </div>
            )}
          </CardContent>
          {employeeDetails && promotionType && (
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
            {mockPendingPromotionRequests.length > 0 ? (
              mockPendingPromotionRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Promotion for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Type: {request.promotionType}</p>
                  <p className="text-sm text-muted-foreground">Current Cadre: {request.currentCadre}</p>
                  <p className="text-sm text-muted-foreground">Proposed Cadre: {request.proposedCadre}</p>
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
              <p className="text-muted-foreground">No promotion requests pending review.</p>
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
                        <Label className="text-right font-semibold">Proposed Cadre:</Label>
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

