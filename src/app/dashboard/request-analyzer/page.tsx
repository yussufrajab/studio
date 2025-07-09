'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Wand2, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { analyzeRequest, AnalyzeRequestOutput } from '@/ai/flows/request-analyzer';
import type { Employee } from '@/lib/types';

export default function RequestAnalyzerPage() {
  const [requestDescription, setRequestDescription] = useState('');
  const [zanId, setZanId] = useState('');
  const [employeeDetails, setEmployeeDetails] = useState<Employee | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzeRequestOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingEmployee, setIsFetchingEmployee] = useState(false);

  const handleFetchEmployee = async () => {
    if (!zanId) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID.", variant: "destructive" });
      return;
    }
    setIsFetchingEmployee(true);
    setEmployeeDetails(null);
    try {
      const response = await fetch(`/api/employees/search?zanId=${zanId}`);
      if (!response.ok) throw new Error('Employee not found');
      const data: Employee = await response.json();
      setEmployeeDetails(data);
      toast({ title: "Employee Found", description: `Details for ${data.name} loaded.` });
    } catch (error) {
      toast({ title: "Error", description: "Could not find employee.", variant: "destructive" });
    } finally {
      setIsFetchingEmployee(false);
    }
  };

  const handleAnalyze = async () => {
    if (!requestDescription.trim()) {
      toast({ title: "Description Required", description: "Please enter a request description.", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      let employeeDetailsString = '';
      if (employeeDetails) {
        employeeDetailsString = `Name: ${employeeDetails.name}, ZanID: ${employeeDetails.zanId}, Cadre: ${employeeDetails.cadre}, Institution: ${typeof employeeDetails.institution === 'object' ? employeeDetails.institution.name : employeeDetails.institution}`;
      }
      
      const result = await analyzeRequest({ 
        requestDescription,
        employeeDetails: employeeDetailsString,
       });

      setAnalysisResult(result);
    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast({ title: "Analysis Failed", description: "Could not analyze the request using AI.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="AI Request Analyzer"
        description="Use AI to automatically suggest the category and reviewer for an employee request."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Input Request</CardTitle>
            <CardDescription>Enter the details of the request below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="requestDescription">Request Description</Label>
              <Textarea
                id="requestDescription"
                placeholder="Paste or type the full text of the employee's request here..."
                value={requestDescription}
                onChange={(e) => setRequestDescription(e.target.value)}
                rows={10}
                disabled={isAnalyzing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zanIdInput">Employee ZanID (Optional)</Label>
              <div className="flex space-x-2">
                <Input
                  id="zanIdInput"
                  placeholder="Enter ZanID to include employee context"
                  value={zanId}
                  onChange={(e) => setZanId(e.target.value)}
                  disabled={isAnalyzing || isFetchingEmployee}
                />
                <Button onClick={handleFetchEmployee} disabled={isAnalyzing || isFetchingEmployee || !zanId}>
                  {isFetchingEmployee ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Fetch
                </Button>
              </div>
               {employeeDetails && (
                <p className="text-sm text-muted-foreground pt-2">
                  Context for: <span className="font-semibold">{employeeDetails.name}</span>
                </p>
              )}
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing || !requestDescription.trim()} className="w-full">
              {isAnalyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
              Analyze Request
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>AI Analysis Result</CardTitle>
            <CardDescription>The AI's suggestions will appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Analyzing request...</p>
              </div>
            ) : analysisResult ? (
              <div className="space-y-6">
                <div>
                  <Label className="text-muted-foreground">Suggested Category</Label>
                  <p className="text-xl font-semibold text-primary">{analysisResult.suggestedCategory}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Suggested Reviewer</Label>
                  <p className="text-xl font-semibold">{analysisResult.suggestedReviewer}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Justification</Label>
                  <p className="text-base text-foreground bg-secondary/50 p-3 rounded-md border">{analysisResult.justification}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Results will be shown here after analysis.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
