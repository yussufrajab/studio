
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import { analyzeRequest } from '@/ai/flows/request-analyzer';
import React, { useState } from 'react';
import type { Employee } from '@/lib/types';
import { toast }  from '@/hooks/use-toast';
import { Loader2, Search, FileText, CheckCircle, Award } from 'lucide-react';

export default function ConfirmationPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [employeeToConfirm, setEmployeeToConfirm] = useState<Employee | null>(null);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);
  
  const [evaluationFormFile, setEvaluationFormFile] = useState<FileList | null>(null);
  const [ipaCertificateFile, setIpaCertificateFile] = useState<FileList | null>(null);
  const [letterOfRequestFile, setLetterOfRequestFile] = useState<FileList | null>(null);

  const [analysisResult, setAnalysisResult] = useState<{ suggestedCategory?: string; suggestedReviewer?: string; justification?: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFetchEmployeeDetails = () => {
    if (!zanId) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID.", variant: "destructive" });
      return;
    }
    setIsFetchingEmployee(true);
    setEmployeeToConfirm(null); 
    setAnalysisResult(null);
    setEvaluationFormFile(null);
    setIpaCertificateFile(null);
    setLetterOfRequestFile(null);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => (input as HTMLInputElement).value = '');

    setTimeout(() => {
      const foundEmployee = EMPLOYEES.find(emp => emp.zanId === zanId);
      if (foundEmployee) {
        setEmployeeToConfirm(foundEmployee);
        toast({ title: "Employee Found", description: `Details for ${foundEmployee.name} loaded.` });
      } else {
        toast({ title: "Employee Not Found", description: `No employee found with ZanID: ${zanId}.`, variant: "destructive" });
      }
      setIsFetchingEmployee(false);
    }, 1000);
  };

  const handleAnalyzeRequest = async () => {
    if (!employeeToConfirm) {
      toast({ title: "Analysis Error", description: "Please fetch employee details first.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const requestDescription = `Employee Confirmation Request for ${employeeToConfirm.name} (ZanID: ${employeeToConfirm.zanId}, Department: ${employeeToConfirm.department}, Cadre: ${employeeToConfirm.cadre}). Status: ${employeeToConfirm.status}.`;
      const result = await analyzeRequest({ 
        requestDescription, 
        employeeDetails: `Name: ${employeeToConfirm.name}, ZanID: ${employeeToConfirm.zanId}, Department: ${employeeToConfirm.department}, Cadre: ${employeeToConfirm.cadre}`
      });
      setAnalysisResult(result);
      toast({ title: "Analysis Complete", description: "AI suggestions are now available." });
    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({ title: "Analysis Failed", description: "Could not get AI suggestions.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitRequest = () => {
    if (!employeeToConfirm) {
      toast({ title: "Submission Error", description: "Employee details are missing.", variant: "destructive" });
      return;
    }
    if (!evaluationFormFile || !ipaCertificateFile || !letterOfRequestFile) {
      toast({ title: "Submission Error", description: "Please upload all required documents (PDF only).", variant: "destructive" });
      return;
    }
    
    const checkPdf = (fileList: FileList | null) => fileList && fileList[0] && fileList[0].type === "application/pdf";
    if (!checkPdf(evaluationFormFile) || !checkPdf(ipaCertificateFile) || !checkPdf(letterOfRequestFile)) {
        toast({ title: "Submission Error", description: "All uploaded documents must be in PDF format.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    console.log("Submitting Confirmation Request:", {
      employee: employeeToConfirm,
      evaluationForm: evaluationFormFile[0]?.name,
      ipaCertificate: ipaCertificateFile[0]?.name,
      letterOfRequest: letterOfRequestFile[0]?.name,
      analysis: analysisResult,
    });
    setTimeout(() => {
      toast({ title: "Request Submitted", description: `Confirmation request for ${employeeToConfirm.name} submitted successfully.` });
      setZanId('');
      setEmployeeToConfirm(null);
      setEvaluationFormFile(null);
      setIpaCertificateFile(null);
      setLetterOfRequestFile(null);
      setAnalysisResult(null);
      
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach(input => (input as HTMLInputElement).value = '');

      setIsSubmitting(false);
    }, 1500);
  };


  return (
    <div>
      <PageHeader title="Employee Confirmation" description="Manage employee confirmation processes." />
      {role === ROLES.HRO && (
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit Confirmation Request</CardTitle>
            <CardDescription>Enter employee's ZanID to fetch details and upload required PDF documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="zanId">Employee ZanID</Label>
              <div className="flex space-x-2">
                <Input id="zanId" placeholder="Enter ZanID" value={zanId} onChange={(e) => setZanId(e.target.value)} disabled={isFetchingEmployee || isSubmitting} />
                <Button onClick={handleFetchEmployeeDetails} disabled={isFetchingEmployee || !zanId || isSubmitting}>
                  {isFetchingEmployee ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Fetch Details
                </Button>
              </div>
            </div>

            {employeeToConfirm && (
              <div className="space-y-6 pt-2">
                <div>
                  <h3 className="text-lg font-medium mb-2 text-foreground">Employee Details</h3>
                  <div className="p-4 rounded-md border bg-secondary/20 space-y-3 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                      <div><Label className="text-muted-foreground">Name:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.name}</p></div>
                      <div><Label className="text-muted-foreground">ZanID:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.zanId}</p></div>
                      <div><Label className="text-muted-foreground">Department:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.department || 'N/A'}</p></div>
                      <div><Label className="text-muted-foreground">Cadre/Position:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.cadre || 'N/A'}</p></div>
                      <div className="md:col-span-2"><Label className="text-muted-foreground">Current Status:</Label> <p className="font-semibold text-foreground">{employeeToConfirm.status || 'N/A'}</p></div>
                    </div>
                  </div>
                </div>
            
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-foreground">Required Documents (PDF Only)</h3>
                  <div>
                    <Label htmlFor="evaluationForm" className="flex items-center"><FileText className="mr-2 h-4 w-4 text-primary" />Upload Evaluation Form</Label>
                    <Input id="evaluationForm" type="file" onChange={(e) => setEvaluationFormFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="ipaCertificate" className="flex items-center"><Award className="mr-2 h-4 w-4 text-primary" />Upload IPA Certificate</Label>
                    <Input id="ipaCertificate" type="file" onChange={(e) => setIpaCertificateFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                  <div>
                    <Label htmlFor="letterOfRequest" className="flex items-center"><CheckCircle className="mr-2 h-4 w-4 text-primary" />Upload Letter of Request</Label>
                    <Input id="letterOfRequest" type="file" onChange={(e) => setLetterOfRequestFile(e.target.files)} accept=".pdf" disabled={isSubmitting}/>
                  </div>
                </div>
              </div>
            )}

            {analysisResult && employeeToConfirm && (
              <Card className="mt-4 bg-accent/10">
                <CardHeader>
                  <CardTitle className="text-base">AI Analysis Suggestion</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p><strong>Suggested Category:</strong> {analysisResult.suggestedCategory}</p>
                  <p><strong>Suggested Reviewer:</strong> {analysisResult.suggestedReviewer}</p>
                  <p><strong>Justification:</strong> {analysisResult.justification}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
          {employeeToConfirm && (
            <CardFooter className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={handleAnalyzeRequest} disabled={isAnalyzing || !employeeToConfirm || isSubmitting}>
                  {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Analyze with AI
                </Button>
                <Button onClick={handleSubmitRequest} disabled={!employeeToConfirm || !evaluationFormFile || !ipaCertificateFile || !letterOfRequestFile || isSubmitting || isAnalyzing}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
            </CardFooter>
          )}
        </Card>
      )}

      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Confirmation Requests</CardTitle>
            <CardDescription>Approve or reject pending employee confirmation requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No confirmation requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

