
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState } from 'react';
import type { Employee } from '@/lib/types';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, Award, ChevronsUpDown } from 'lucide-react';

export default function PromotionPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [proposedCadre, setProposedCadre] = useState('');
  const [performanceAppraisalFile, setPerformanceAppraisalFile] = useState<FileList | null>(null);
  const [certificateFile, setCertificateFile] = useState<FileList | null>(null);
  const [studiedOutsideCountry, setStudiedOutsideCountry] = useState(false);
  const [tcuFormFile, setTcuFormFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  const resetFormFields = () => {
    setProposedCadre('');
    setPerformanceAppraisalFile(null);
    setCertificateFile(null);
    setStudiedOutsideCountry(false);
    setTcuFormFile(null);
    setLetterOfRequestFile(null);
    // Clear file input values
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

  const handleSubmitPromotionRequest = () => {
    if (!employeeDetails) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!proposedCadre || !performanceAppraisalFile || !certificateFile || !letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Please fill all required fields and upload necessary documents (PDF only).", variant: "destructive" });
      return;
    }
    if (studiedOutsideCountry && !tcuFormFile) {
      toast({ title: "Submission Error", description: "TCU Form is required as employee studied outside the country.", variant: "destructive" });
      return;
    }

    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";
    
    if (!checkPdf(performanceAppraisalFile) || !checkPdf(certificateFile) || (studiedOutsideCountry && !checkPdf(tcuFormFile)) || !checkPdf(letterOfRequestFile)) {
        toast({ title: "Submission Error", description: "All uploaded documents must be in PDF format.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    console.log("Submitting Promotion Request:", {
      employee: employeeDetails,
      proposedCadre,
      performanceAppraisalFile: performanceAppraisalFile[0]?.name,
      certificateFile: certificateFile[0]?.name,
      studiedOutsideCountry,
      tcuFormFile: tcuFormFile ? tcuFormFile[0]?.name : null,
      letterOfRequestFile: letterOfRequestFile[0]?.name,
    });

    setTimeout(() => {
      toast({ title: "Promotion Request Submitted", description: `Promotion request for ${employeeDetails.name} submitted successfully.` });
      setZanId('');
      setEmployeeDetails(null);
      resetFormFields();
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div>
      <PageHeader title="Promotion" description="Manage employee promotions." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Promotion Request</CardTitle>
            <CardDescription>Enter employee's ZanID to fetch details, then complete the promotion form.</CardDescription>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div><Label className="text-muted-foreground">Name:</Label> <p className="font-semibold text-foreground">{employeeDetails.name}</p></div>
                      <div><Label className="text-muted-foreground">ZanID:</Label> <p className="font-semibold text-foreground">{employeeDetails.zanId}</p></div>
                      <div><Label className="text-muted-foreground">Department:</Label> <p className="font-semibold text-foreground">{employeeDetails.department || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Current Cadre/Position:</Label> <p className="font-semibold text-foreground">{employeeDetails.cadre || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>
            
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Promotion Details & Documents (PDF Only)</h3>
                  <div>
                    <Label htmlFor="proposedCadre">Proposed New Cadre/Position</Label>
                    <Input id="proposedCadre" placeholder="e.g., Principal Officer" value={proposedCadre} onChange={(e) => setProposedCadre(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div>
                    <Label htmlFor="performanceAppraisalFile" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Performance Appraisal Form</Label>
                    <Input id="performanceAppraisalFile" type="file" onChange={(e) => setPerformanceAppraisalFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="certificateFile" className="flex items-center"><Award className="mr-2 h-4 w-4 text-primary" />Upload Certificate</Label>
                    <Input id="certificateFile" type="file" onChange={(e) => setCertificateFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="studiedOutsideCountry" checked={studiedOutsideCountry} onCheckedChange={(checked) => setStudiedOutsideCountry(checked as boolean)} disabled={isSubmitting} />
                    <Label htmlFor="studiedOutsideCountry" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Employee studied outside the country? (Requires TCU Form)
                    </Label>
                  </div>
                  {studiedOutsideCountry && (
                    <div>
                      <Label htmlFor="tcuFormFile" className="flex items-center"><ChevronsUpDown className="mr-2 h-4 w-4 text-primary" />Upload TCU Form</Label>
                      <Input id="tcuFormFile" type="file" onChange={(e) => setTcuFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="letterOfRequestPromo" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                    <Input id="letterOfRequestPromo" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          {employeeDetails && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                <Button onClick={handleSubmitPromotionRequest} 
                        disabled={
                            !employeeDetails || 
                            !proposedCadre || 
                            !performanceAppraisalFile || 
                            !certificateFile || 
                            (studiedOutsideCountry && !tcuFormFile) || 
                            !letterOfRequestFile || 
                            isSubmitting
                        }>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Promotion Request
                </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Promotion Requests</CardTitle>
            <CardDescription>Approve or reject pending promotion requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No promotion requests pending review.</p>
            {/* Placeholder for actual list of requests */}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
    
    