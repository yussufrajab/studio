
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
import { Loader2, Search, FileText, CalendarDays, Paperclip } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Pagination } from '@/components/shared/pagination';

interface MockPendingResignationRequest {
  id: string;
  employeeName: string;
  zanId: string;
  department: string;
  cadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  effectiveDate: string;
  reason?: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  documents?: string[];
}

const mockPendingResignationRequests: MockPendingResignationRequest[] = [
  {
    id: 'RESIGN001',
    employeeName: 'Zainab Ali Khamis',
    zanId: '556789345',
    department: 'Planning',
    cadre: 'Planning Officer',
    employmentDate: "2022-02-01",
    dateOfBirth: "1992-12-30",
    institution: "TUME YA UTUMISHI SERIKALINI",
    effectiveDate: '2024-09-30',
    reason: 'Relocating to another country.',
    submissionDate: '2024-07-20',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN002',
    employeeName: 'Hassan Mzee Juma',
    zanId: '445678912',
    department: 'ICT',
    cadre: 'IT Support',
    employmentDate: "2017-01-20",
    dateOfBirth: "1975-09-01",
    institution: "WAKALA WA SERIKALI MTANDAO (eGAZ)",
    effectiveDate: '2024-08-15',
    reason: 'Pursuing further studies.',
    submissionDate: '2024-07-15',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN003',
    employeeName: 'Ali Juma Ali',
    zanId: '221458232',
    department: 'Administration',
    cadre: 'Administrative Officer',
    employmentDate: "2023-01-10",
    dateOfBirth: "1980-05-15",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2024-10-01',
    reason: 'Found a better opportunity elsewhere.',
    submissionDate: '2024-07-01',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN004',
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    department: 'Finance',
    cadre: 'Accountant',
    employmentDate: "2018-09-15",
    dateOfBirth: "1988-02-10",
    institution: "Ofisi ya Mhasibu Mkuu wa Serikali",
    effectiveDate: '2024-11-20',
    reason: 'Personal reasons.',
    submissionDate: '2024-08-20',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Acknowledged',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN005',
    employeeName: 'Juma Omar Ali',
    zanId: '667890456',
    department: 'Procurement',
    cadre: 'Procurement Officer',
    employmentDate: "2015-10-11",
    dateOfBirth: "1983-06-18",
    institution: "WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA",
    effectiveDate: '2024-12-31',
    reason: 'Starting a personal business.',
    submissionDate: '2024-09-25',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  // Add 10 more
  {
    id: 'RESIGN006',
    employeeName: 'Khadija Nassor',
    zanId: '890123456',
    department: 'Secondary Education',
    cadre: 'Head Teacher',
    employmentDate: "1990-07-15",
    dateOfBirth: "1970-01-20",
    institution: "WIZARA YA ELIMU NA MAFUNZO YA AMALI",
    effectiveDate: '2025-01-10',
    reason: 'Early retirement.',
    submissionDate: '2024-10-10',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN007',
    employeeName: 'Yussuf Makame',
    zanId: '901234567',
    department: 'Primary Education',
    cadre: 'Teacher',
    employmentDate: "2018-08-20",
    dateOfBirth: "1995-04-11",
    institution: "WIZARA YA ELIMU NA MAFUNZO YA AMALI",
    effectiveDate: '2024-11-30',
    reason: 'Health reasons.',
    submissionDate: '2024-08-28',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN008',
    employeeName: 'Asha Hamad Faki',
    zanId: '101010101',
    department: 'Secretarial',
    cadre: 'Secretary',
    employmentDate: "2019-07-22",
    dateOfBirth: "1990-01-01",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2025-02-15',
    reason: 'Family relocation.',
    submissionDate: '2024-11-15',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN009',
    employeeName: 'Salim Omar Bakar',
    zanId: '111111111',
    department: 'Finance',
    cadre: 'Accountant Assistant',
    employmentDate: "2021-02-15",
    dateOfBirth: "1994-05-20",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2025-03-01',
    submissionDate: '2024-12-01',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN010',
    employeeName: 'Ismail Mohamed Kassim',
    zanId: '131313131',
    department: 'Administration',
    cadre: 'Senior Administrative Officer',
    employmentDate: "2015-03-10",
    dateOfBirth: "1985-08-15",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2025-04-20',
    submissionDate: '2025-01-20',
    status: 'Acknowledged',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN011',
    employeeName: 'Riziki Mussa Haji',
    zanId: '141414141',
    department: 'Human Resources',
    cadre: 'HR Officer',
    employmentDate: "2017-11-01",
    dateOfBirth: "1989-02-28",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2025-05-18',
    submissionDate: '2025-02-18',
    status: 'Pending HHRMD Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN012',
    employeeName: 'Kassim Ali Khamis',
    zanId: '151515151',
    department: 'Support Staff',
    cadre: 'Office Assistant',
    employmentDate: "2024-01-05",
    dateOfBirth: "2000-03-14",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2025-01-01',
    submissionDate: '2024-10-01',
    status: 'Pending HRMO Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN013',
    employeeName: 'Naila Said Suleiman',
    zanId: '161616161',
    department: 'Economics',
    cadre: 'Economist',
    employmentDate: "2016-08-20",
    dateOfBirth: "1991-07-25",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2024-12-01',
    submissionDate: '2024-09-01',
    status: 'Acknowledged',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN014',
    employeeName: 'Abdalla Foum Abdalla',
    zanId: '171717171',
    department: 'ICT',
    cadre: 'IT Officer',
    employmentDate: "2020-05-30",
    dateOfBirth: "1993-10-05",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2025-02-28',
    submissionDate: '2024-11-28',
    status: 'Pending HHRMD Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
  {
    id: 'RESIGN015',
    employeeName: 'Zuhura Juma Makame',
    zanId: '181818181',
    department: 'Legal',
    cadre: 'Legal Officer',
    employmentDate: "2018-09-12",
    dateOfBirth: "1992-12-12",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    effectiveDate: '2025-03-15',
    submissionDate: '2024-12-15',
    status: 'Pending HRMO Acknowledgement',
    documents: ['Letter of Request', '3 Month Notice/Receipt'],
  },
];


export default function ResignationPage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');
  const [noticeOrReceiptFile, setNoticeOrReceiptFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);
  const [minEffectiveDate, setMinEffectiveDate] = useState('');

  const [pendingRequests, setPendingRequests] = useState<MockPendingResignationRequest[]>(mockPendingResignationRequests);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingResignationRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setMinEffectiveDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

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

  const handleSubmitResignationRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!effectiveDate) {
      toast({ title: "Submission Error", description: "Effective Date of Resignation is required.", variant: "destructive" });
      return;
    }
    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (!noticeOrReceiptFile) {
      toast({ title: "Submission Error", description: "3 months resignation notice or receipt is required. Please upload the PDF document.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";

    if (!checkPdf(letterOfRequestFile)) {
      toast({ title: "Submission Error", description: "Letter of Request must be a PDF file.", variant: "destructive" });
      return;
    }
    if (!checkPdf(noticeOrReceiptFile)) {
      toast({ title: "Submission Error", description: "The 3 months notice or receipt must be a PDF file.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    const newRequestId = `RESIGN${Date.now().toString().slice(-3)}`;
    const documentsList = ['Letter of Request', '3 Month Notice/Receipt'];

    const newRequest: MockPendingResignationRequest = {
        id: newRequestId,
        employeeName: employeeDetails.name,
        zanId: employeeDetails.zanId,
        department: employeeDetails.department || 'N/A',
        cadre: employeeDetails.cadre || 'N/A',
        employmentDate: employeeDetails.employmentDate || 'N/A',
        dateOfBirth: employeeDetails.dateOfBirth || 'N/A',
        institution: employeeDetails.institution || 'N/A',
        effectiveDate: effectiveDate,
        reason: reason,
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        submittedBy: `${user?.name} (${user?.role})`,
        status: 'Pending HHRMD Acknowledgement',
        documents: documentsList,
    };

    console.log("Submitting Resignation Request:", newRequest);

    setTimeout(() => {
      setPendingRequests(prev => [newRequest, ...prev]);
      toast({ title: "Resignation Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
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
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Resignation for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">Effective Date: {request.effectiveDate ? format(parseISO(request.effectiveDate), 'PPP') : 'N/A'}</p>
                  {request.reason && <p className="text-sm text-muted-foreground">Reason: {request.reason}</p>}
                  <p className="text-sm text-muted-foreground">Submitted: {request.submissionDate ? format(parseISO(request.submissionDate), 'PPP') : 'N/A'} by {request.submittedBy}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{request.status}</span></p>
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(request); setIsDetailsModalOpen(true); }}>View Details</Button>
                    <Button size="sm">Acknowledge</Button>
                    <Button size="sm" variant="destructive">Flag Issue</Button>
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
                Resignation request for <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
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
                        <Label className="text-right font-semibold">Effective Date:</Label>
                        <p className="col-span-2">{selectedRequest.effectiveDate ? format(parseISO(selectedRequest.effectiveDate), 'PPP') : 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold pt-1">Reason:</Label>
                        <p className="col-span-2">{selectedRequest.reason || 'Not specified'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Submitted:</Label>
                        <p className="col-span-2">{selectedRequest.submissionDate ? format(parseISO(selectedRequest.submissionDate), 'PPP') : 'N/A'} by {selectedRequest.submittedBy}</p>
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
