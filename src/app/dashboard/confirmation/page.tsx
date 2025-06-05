'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import { analyzeRequest } from '@/ai/flows/request-analyzer';
import React, { useState } from 'react';
import { toast }  from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ConfirmationPage() {
  const { role } = useAuth();
  const [employeeDetails, setEmployeeDetails] = useState('');
  const [documents, setDocuments] = useState<FileList | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ suggestedCategory?: string; suggestedReviewer?: string; justification?: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeRequest = async () => {
    if (!employeeDetails) {
      toast({ title: "Analysis Error", description: "Please provide employee details.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeRequest({ requestDescription: "Employee Confirmation Request: " + employeeDetails, employeeDetails });
      setAnalysisResult(result);
      toast({ title: "Analysis Complete", description: "AI suggestions are now available." });
    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({ title: "Analysis Failed", description: "Could not get AI suggestions.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div>
      <PageHeader title="Employee Confirmation" description="Manage employee confirmation processes." />
      {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Confirmation Request</CardTitle>
            <CardDescription>Fill in the details to submit an employee confirmation request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeDetails">Employee Details &amp; Probation Report Summary</Label>
              <Textarea id="employeeDetails" placeholder="Enter employee ZanID, name, department, and summary of probation report..." value={employeeDetails} onChange={(e) => setEmployeeDetails(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="documents">Upload Supporting Documents (Probation Report, etc.)</Label>
              <Input id="documents" type="file" multiple onChange={(e) => setDocuments(e.target.files)} />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleAnalyzeRequest} disabled={isAnalyzing}>
                {isAnalyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Request with AI
              </Button>
              <Button>Submit Request</Button>
            </div>
            {analysisResult && (
              <Card className="mt-4 bg-secondary/50">
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
        </Card>
      )}

      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card>
          <CardHeader>
            <CardTitle>Review Confirmation Requests</CardTitle>
            <CardDescription>Approve or reject pending employee confirmation requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for list of requests to review */}
            <p className="text-muted-foreground">No confirmation requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
