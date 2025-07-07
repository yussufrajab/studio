
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, Award, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parseISO, differenceInYears } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Pagination } from '@/components/shared/pagination';


interface MockPendingCadreChangeRequest {
  id: string;
  employeeName: string;
  zanId: string;
  payrollNumber?: string;
  zssfNumber?: string;
  department: string;
  currentCadre: string;
  employmentDate: string;
  dateOfBirth: string;
  institution: string;
  newCadre: string;
  submissionDate: string;
  submittedBy: string;
  status: string;
  reason?: string;
  documents?: string[];
  studiedOutsideCountry?: boolean;
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: string;
}

const initialMockPendingCadreChangeRequests: MockPendingCadreChangeRequest[] = [
  {
    id: 'CADRE001',
    employeeName: 'Ali Juma Ali',
    zanId: '221458232',
    payrollNumber: "PAY001",
    zssfNumber: "ZSSF001",
    department: 'Administration',
    currentCadre: 'Administrative Officer',
    employmentDate: "2023-01-10",
    dateOfBirth: "1980-05-15",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    newCadre: 'Senior Administrative Officer',
    submissionDate: '2024-07-29',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    reason: "Completed Masters in Public Admin and has 5 years experience.",
    documents: ['Certificate (Masters)', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE002',
    employeeName: 'Safia Juma Ali',
    zanId: '125468957',
    payrollNumber: "PAY002",
    zssfNumber: "ZSSF002",
    department: 'Human Resources',
    currentCadre: 'HR Officer',
    employmentDate: "2020-12-01",
    dateOfBirth: "1990-11-22",
    institution: "KAMISHENI YA UTUMISHI WA UMMA",
    newCadre: 'HR Specialist (Training)',
    submissionDate: '2024-07-27',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    reason: "Obtained professional certification in Training and Development from recognized institution abroad.",
    documents: ['Professional Certificate', 'TCU Form', 'Letter of Request'],
    studiedOutsideCountry: true,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE003',
    employeeName: 'Hassan Mzee Juma',
    zanId: '445678912',
    payrollNumber: "PAY004",
    zssfNumber: "ZSSF004",
    department: 'ICT',
    currentCadre: 'IT Support',
    employmentDate: "2011-11-11",
    dateOfBirth: "1975-09-01",
    institution: "WAKALA WA SERIKALI MTANDAO (eGAZ)",
    newCadre: 'IT Officer',
    submissionDate: '2024-07-25',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Request Received – Awaiting Commission Decision',
    reason: "Upgraded skills and has taken on more responsibilities.",
    documents: ['Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'commission_review',
  },
  {
    id: 'CADRE004',
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    payrollNumber: "PAY003",
    zssfNumber: "ZSSF003",
    department: 'Finance',
    currentCadre: 'Accountant',
    employmentDate: "2018-09-15",
    dateOfBirth: "1988-02-10",
    institution: "Ofisi ya Mhasibu Mkuu wa Serikali",
    newCadre: 'Senior Accountant',
    submissionDate: '2024-07-22',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Approved by Commission',
    reason: "Successfully passed CPA exams.",
    documents: ['CPA Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'completed',
  },
  {
    id: 'CADRE005',
    employeeName: 'Zainab Ali Khamis',
    zanId: '556789345',
    payrollNumber: "PAY005",
    zssfNumber: "ZSSF005",
    department: 'Planning',
    currentCadre: 'Planning Officer',
    employmentDate: "2022-02-01",
    dateOfBirth: "1992-12-30",
    institution: "TUME YA UTUMISHI SERIKALINI",
    newCadre: 'Senior Planning Officer',
    submissionDate: '2024-07-20',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Rejected by HHRMD - Awaiting HRO Correction',
    reason: "New qualifications obtained.",
    rejectionReason: 'Submitted certificate is not from a recognized institution.',
    documents: ['Academic Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE006',
    employeeName: 'Juma Omar Ali',
    zanId: '667890456',
    payrollNumber: "PAY006",
    zssfNumber: "ZSSF006",
    department: 'Procurement',
    currentCadre: 'Procurement Officer',
    employmentDate: "2015-10-11",
    dateOfBirth: "1983-06-18",
    institution: "WIZARA YA BIASHARA NA MAENDELEO YA VIWANDA",
    newCadre: 'Senior Procurement Officer',
    submissionDate: '2024-07-18',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    reason: 'Education advancement.',
    documents: ['Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE007',
    employeeName: 'Hamid Khalfan Abdalla',
    zanId: '778901234',
    payrollNumber: "PAY007",
    zssfNumber: "ZSSF007",
    department: 'Transport',
    currentCadre: 'Senior Driver',
    employmentDate: "2010-01-01",
    dateOfBirth: "1978-03-25",
    institution: "WIZARA YA UJENZI MAWASILIANO NA UCHUKUZI",
    newCadre: 'Transport Supervisor',
    submissionDate: '2024-07-15',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    reason: 'Long service and new responsibilities.',
    documents: ['Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE008',
    employeeName: 'Khadija Nassor',
    zanId: '890123456',
    payrollNumber: "PAY008",
    zssfNumber: "ZSSF008",
    department: 'Secondary Education',
    currentCadre: 'Head Teacher',
    employmentDate: "1990-07-15",
    dateOfBirth: "1970-01-20",
    institution: "WIZARA YA ELIMU NA MAFUNZO YA AMALI",
    newCadre: 'District Education Officer',
    submissionDate: '2024-07-12',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    reason: 'Masters Degree completion.',
    documents: ['Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE009',
    employeeName: 'Yussuf Makame',
    zanId: '901234567',
    payrollNumber: "PAY009",
    zssfNumber: "ZSSF009",
    department: 'Primary Education',
    currentCadre: 'Teacher',
    employmentDate: "2018-08-20",
    dateOfBirth: "1995-04-11",
    institution: "WIZARA YA ELIMU NA MAFUNZO YA AMALI",
    newCadre: 'Senior Teacher',
    submissionDate: '2024-07-10',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    reason: 'Passed teaching proficiency exams.',
    documents: ['Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE010',
    employeeName: 'Asha Hamad Faki',
    zanId: '101010101',
    payrollNumber: "PAY010",
    zssfNumber: "ZSSF010",
    department: 'Secretarial',
    currentCadre: 'Secretary',
    employmentDate: "2019-07-22",
    dateOfBirth: "1990-01-01",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    newCadre: 'Personal Assistant',
    submissionDate: '2024-07-08',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Rejected by Commission',
    reason: 'New diploma in administration.',
    rejectionReason: 'Proposed cadre requires a degree.',
    documents: ['Diploma Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'completed',
  },
  {
    id: 'CADRE011',
    employeeName: 'Salim Omar Bakar',
    zanId: '111111111',
    payrollNumber: "PAY011",
    zssfNumber: "ZSSF011",
    department: 'Finance',
    currentCadre: 'Accountant Assistant',
    employmentDate: "2021-02-15",
    dateOfBirth: "1994-05-20",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    newCadre: 'Accountant',
    submissionDate: '2024-07-05',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    reason: 'Obtained ATEC II qualification.',
    documents: ['ATEC II Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE012',
    employeeName: 'Ismail Mohamed Kassim',
    zanId: '131313131',
    payrollNumber: "PAY013",
    zssfNumber: "ZSSF013",
    department: 'Administration',
    currentCadre: 'Senior Administrative Officer',
    employmentDate: "2015-03-10",
    dateOfBirth: "1985-08-15",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    newCadre: 'Principal Administrative Officer',
    submissionDate: '2024-07-01',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Request Received – Awaiting Commission Decision',
    reason: 'Long service and proven leadership.',
    documents: ['Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'commission_review',
  },
  {
    id: 'CADRE013',
    employeeName: 'Riziki Mussa Haji',
    zanId: '141414141',
    payrollNumber: "PAY014",
    zssfNumber: "ZSSF014",
    department: 'Human Resources',
    currentCadre: 'HR Officer',
    employmentDate: "2017-11-01",
    dateOfBirth: "1989-02-28",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    newCadre: 'Senior HR Officer',
    submissionDate: '2024-06-28',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HHRMD Review',
    reason: 'Education advancement (Masters).',
    documents: ['Certificate', 'Letter of Request', 'TCU Form'],
    studiedOutsideCountry: true,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE014',
    employeeName: 'Abdalla Foum Abdalla',
    zanId: '171717171',
    payrollNumber: "PAY017",
    zssfNumber: "ZSSF017",
    department: 'ICT',
    currentCadre: 'IT Officer',
    employmentDate: "2020-05-30",
    dateOfBirth: "1993-10-05",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    newCadre: 'Systems Analyst',
    submissionDate: '2024-06-25',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Pending HRMO Review',
    reason: 'Gained new certification in systems analysis.',
    documents: ['Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'initial',
  },
  {
    id: 'CADRE015',
    employeeName: 'Zuhura Juma Makame',
    zanId: '181818181',
    payrollNumber: "PAY018",
    zssfNumber: "ZSSF018",
    department: 'Legal',
    currentCadre: 'Legal Officer',
    employmentDate: "2018-09-12",
    dateOfBirth: "1992-12-12",
    institution: "OFISI YA RAIS, FEDHA NA MIPANGO",
    newCadre: 'Senior Legal Officer',
    submissionDate: '2024-06-20',
    submittedBy: 'K. Mnyonge (HRO)',
    status: 'Approved by Commission',
    reason: 'Admitted to the bar.',
    documents: ['Bar Admission Certificate', 'Letter of Request'],
    studiedOutsideCountry: false,
    reviewStage: 'completed',
  },
];


export default function CadreChangePage() {
  const { role, user } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCadre, setNewCadre] = useState('');
  const [reasonCadreChange, setReasonCadreChange] = useState('');
  const [certificateFile, setCertificateFile] = useState<FileList | null>(null);
  const [studiedOutsideCountry, setStudiedOutsideCountry] = useState(false);
  const [tcuFormFile, setTcuFormFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  const [pendingRequests, setPendingRequests] = useState<MockPendingCadreChangeRequest[]>(initialMockPendingCadreChangeRequests);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingCadreChangeRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockPendingCadreChangeRequest | null>(null);

  const [eligibilityError, setEligibilityError] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const resetFormFields = () => {
    setNewCadre('');
    setReasonCadreChange('');
    setCertificateFile(null);
    setStudiedOutsideCountry(false);
    setTcuFormFile(null);
    setLetterOfRequestFile(null);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => (input as HTMLInputElement).value = '');
    const checkboxInput = document.getElementById('studiedOutsideCountryCadre') as HTMLInputElement;
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
          error = `Employee is currently '${foundEmployee.status}' and is not eligible for a cadre change.`;
        } else if (foundEmployee.employmentDate) {
          const yearsOfService = differenceInYears(new Date(), parseISO(foundEmployee.employmentDate));
          if (yearsOfService < 3) {
            error = `Employee must have at least 3 years of service for a cadre change. Current service: ${yearsOfService} years.`;
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

  const handleSubmitRequest = () => {
    if (!!eligibilityError) {
      toast({ title: "Submission Error", description: "This employee is ineligible for a cadre change.", variant: "destructive" });
      return;
    }
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!newCadre || !reasonCadreChange) {
      toast({ title: "Submission Error", description: "Please fill in Proposed New Cadre and Reason for Change.", variant: "destructive" });
      return;
    }
    if (!certificateFile) {
      toast({ title: "Submission Error", description: "Certificate is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (studiedOutsideCountry && !tcuFormFile) {
      toast({ title: "Submission Error", description: "TCU Form is missing as employee studied outside the country. Please upload the PDF document.", variant: "destructive" });
      return;
    }
    if (!letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Letter of Request is missing. Please upload the PDF document.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";
    
    if (!checkPdf(certificateFile)) {
        toast({ title: "Submission Error", description: "Certificate must be a PDF.", variant: "destructive" });
        return;
    }
    if (studiedOutsideCountry && tcuFormFile && !checkPdf(tcuFormFile)){
         toast({ title: "Submission Error", description: "TCU Form must be a PDF.", variant: "destructive" });
        return;
    }
    if (!checkPdf(letterOfRequestFile)) {
        toast({ title: "Submission Error", description: "Letter of Request must be a PDF.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    const newRequestId = `CADRE${Date.now().toString().slice(-3)}`;
    let documentsList = ['Letter of Request', 'Certificate'];
    if (studiedOutsideCountry) documentsList.push('TCU Form');

    const newRequest: MockPendingCadreChangeRequest = {
        id: newRequestId,
        employeeName: employeeDetails.name,
        zanId: employeeDetails.zanId,
        payrollNumber: employeeDetails.payrollNumber,
        zssfNumber: employeeDetails.zssfNumber,
        department: employeeDetails.department || 'N/A',
        currentCadre: employeeDetails.cadre || 'N/A',
        employmentDate: employeeDetails.employmentDate || 'N/A',
        dateOfBirth: employeeDetails.dateOfBirth || 'N/A',
        institution: employeeDetails.institution || 'N/A',
        newCadre: newCadre,
        submissionDate: format(new Date(), 'yyyy-MM-dd'),
        submittedBy: `${user?.name} (${user?.role})`,
        status: role === ROLES.HHRMD ? 'Pending HHRMD Review' : 'Pending HRMO Review',
        reason: reasonCadreChange,
        documents: documentsList,
        studiedOutsideCountry: studiedOutsideCountry,
        reviewStage: 'initial',
    };

    console.log("Submitting Cadre Change Request:", {
      employee: employeeDetails,
      newCadre,
      reasonCadreChange,
      certificateFile: certificateFile[0]?.name,
      studiedOutsideCountry,
      tcuFormFile: tcuFormFile ? tcuFormFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
      setPendingRequests(prev => [newRequest, ...prev]);
      toast({ title: "Cadre Change Request Submitted", description: `Request for ${employeeDetails.name} submitted successfully.` });
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
          return { ...req, status: `Rejected by ${role} - Awaiting HRO Correction`, rejectionReason: rejectionReasonInput, reviewStage: 'initial' }; // Keep reviewStage as 'initial' or manage it as needed
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

  const applicableRequests = pendingRequests.filter(req => 
    (role === ROLES.HHRMD && req.status === 'Pending HHRMD Review') ||
    (role === ROLES.HRMO && req.status === 'Pending HRMO Review') ||
    (role === ROLES.HHRMD && req.status.startsWith('Rejected by') && req.rejectionReason) ||
    (role === ROLES.HHRMD && (req.status.startsWith('Approved by Commission') || req.status.startsWith('Rejected by Commission'))) ||
    (role === ROLES.HRMO && req.status.startsWith('Rejected by') && req.rejectionReason) ||
    (role === ROLES.HRMO && (req.status.startsWith('Approved by Commission') || req.status.startsWith('Rejected by Commission'))) ||
    (req.status === 'Request Received – Awaiting Commission Decision' && req.reviewedBy === role)
  );

  const totalPages = Math.ceil(applicableRequests.length / itemsPerPage);
  const paginatedRequests = applicableRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );


  return (
    <div>
      <PageHeader title="Change of Cadre" description="Process employee cadre changes." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Cadre Change Request</CardTitle>
            <CardDescription>Enter ZanID to fetch details, then complete the form. All documents must be PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanIdCadreChange">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanIdCadreChange" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
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
            
                <div className={`space-y-4 ${!!eligibilityError ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <h3 className="text-lg font-medium text-foreground">Cadre Change Details &amp; Documents (PDF Only)</h3>
                  <div>
                    <Label htmlFor="newCadre">Proposed New Cadre</Label>
                    <Input id="newCadre" placeholder="e.g., Senior Human Resource Officer" value={newCadre} onChange={(e) => setNewCadre(e.target.value)} disabled={isSubmitting || !!eligibilityError} />
                  </div>
                  <div>
                    <Label htmlFor="reasonCadreChange">Reason for Cadre Change &amp; Qualifications</Label>
                    <Textarea id="reasonCadreChange" placeholder="Explain the reason and list relevant qualifications" value={reasonCadreChange} onChange={(e) => setReasonCadreChange(e.target.value)} disabled={isSubmitting || !!eligibilityError} />
                  </div>
                  <div>
                    <Label htmlFor="certificateFileCadre" className="flex items-center"><Award className="mr-2 h-4 w-4 text-primary" />Upload Certificate</Label>
                    <Input id="certificateFileCadre" type="file" onChange={(e) => setCertificateFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="studiedOutsideCountryCadre" checked={studiedOutsideCountry} onCheckedChange={(checked) => setStudiedOutsideCountry(checked as boolean)} disabled={isSubmitting || !!eligibilityError} />
                    <Label htmlFor="studiedOutsideCountryCadre" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Employee studied outside the country? (Requires TCU Form)
                    </Label>
                  </div>
                  {studiedOutsideCountry && (
                    <div>
                      <Label htmlFor="tcuFormFileCadre" className="flex items-center"><ChevronsUpDown className="mr-2 h-4 w-4 text-primary" />Upload TCU Form</Label>
                      <Input id="tcuFormFileCadre" type="file" onChange={(e) => setTcuFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="letterOfRequestCadre" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                    <Input id="letterOfRequestCadre" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting || !!eligibilityError}/>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                <Button onClick={handleSubmitRequest} 
                        disabled={
                            !!eligibilityError ||
                            !employeeDetails || 
                            !newCadre || 
                            !reasonCadreChange ||
                            !certificateFile || 
                            (studiedOutsideCountry && !tcuFormFile) || 
                            !letterOfRequestFile || 
                            isSubmitting
                        }>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
            </CardFooter>
          )}
        </Card>
      )}
      {(role === ROLES.HHRMD || role === ROLES.HRMO) && ( 
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Cadre Change Requests</CardTitle>
            <CardDescription>Review, approve, or reject pending cadre change requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((request) => (
                <div key={request.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Cadre Change for: {request.employeeName} (ZanID: {request.zanId})</h3>
                  <p className="text-sm text-muted-foreground">From Cadre: {request.currentCadre}</p>
                  <p className="text-sm text-muted-foreground">To Cadre: {request.newCadre}</p>
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
              <p className="text-muted-foreground">No cadre change requests pending your review.</p>
            )}
             <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={applicableRequests.length}
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
                Change of Cadre request for <strong>{selectedRequest.employeeName}</strong> (ZanID: {selectedRequest.zanId}).
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
                        <Label className="text-right text-muted-foreground">Payroll #:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.payrollNumber || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">ZSSF #:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.zssfNumber || 'N/A'}</p>
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
                        <Label className="text-right font-semibold">New Cadre:</Label>
                        <p className="col-span-2">{selectedRequest.newCadre}</p>
                    </div>
                    <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold pt-1">Reason:</Label>
                        <p className="col-span-2">{selectedRequest.reason || 'Not specified'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                        <Label className="text-right font-semibold">Studied Outside?:</Label>
                        <p className="col-span-2">{selectedRequest.studiedOutsideCountry ? 'Yes' : 'No'}</p>
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
                    <DialogTitle>Reject Cadre Change Request: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the cadre change request for <strong>{currentRequestToAction.employeeName}</strong>. This reason will be visible to the HRO.
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
