
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import React, { useState } from 'react';
import { standardizeComplaintFormatting } from '@/ai/flows/complaint-rewriter';
import type { ComplaintFormValues } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const complaintSchema = z.object({
  complaintText: z.string().min(10, "Complaint text must be at least 10 characters."),
  category: z.string().optional(),
  // evidence: typeof window === 'undefined' ? z.any() : z.instanceof(FileList).optional(), // File upload handling is complex for RSC, simplifying
});

interface MockPendingComplaint {
  id: string;
  employeeName: string; // Can be "Anonymous" or employee name
  zanId?: string; // Optional if anonymous or from external
  category: string;
  details: string;
  submissionDate: string;
  submittedBy: string; // Could be "Employee Direct" or "HRO Forwarded"
  status: string;
}

const mockPendingComplaints: MockPendingComplaint[] = [
  {
    id: 'COMP001',
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    category: 'Unfair Treatment',
    details: 'Employee states that they were unfairly overlooked for a training opportunity despite meeting all criteria.',
    submissionDate: '2024-07-20',
    submittedBy: 'Fatma Said Omar (Employee)',
    status: 'Pending DO Review',
  },
  {
    id: 'COMP002',
    employeeName: 'Ali Juma Ali',
    zanId: '221458232',
    category: 'Workplace Safety',
    details: 'Complaint regarding inadequate safety equipment in the workshop, leading to a minor preventable incident.',
    submissionDate: '2024-07-18',
    submittedBy: 'Ali Juma Ali (Employee)',
    status: 'Pending HHRMD Review',
  },
];


export default function ComplaintsPage() {
  const { role } = useAuth();
  const [rewrittenComplaint, setRewrittenComplaint] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      complaintText: "",
      category: "",
    },
  });

  const handleStandardizeComplaint = async () => {
    const complaintText = form.getValues("complaintText");
    if (!complaintText) {
      toast({ title: "Rewrite Error", description: "Please enter your complaint text first.", variant: "destructive" });
      return;
    }
    setIsRewriting(true);
    setRewrittenComplaint(null);
    try {
      const result = await standardizeComplaintFormatting({ complaintText });
      setRewrittenComplaint(result.rewrittenComplaint);
      form.setValue("complaintText", result.rewrittenComplaint); // Update form with rewritten text
      toast({ title: "Complaint Standardized", description: "AI has rewritten your complaint for clarity and compliance." });
    } catch (error) {
      console.error("AI Rewrite Error:", error);
      toast({ title: "Rewrite Failed", description: "Could not standardize the complaint using AI.", variant: "destructive" });
    } finally {
      setIsRewriting(false);
    }
  };
  
  const onSubmit = (data: ComplaintFormValues) => {
    console.log("Submitting complaint:", data);
    toast({ title: "Complaint Submitted", description: "Your complaint has been successfully submitted." });
    form.reset();
    setRewrittenComplaint(null);
  };

  return (
    <div>
      <PageHeader title="Complaints" description="Manage employee complaints and resolutions." />
      
      {role === ROLES.EMPLOYEE && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit a Complaint</CardTitle>
            <CardDescription>Describe your complaint clearly. You can use the AI tool to help standardize the text.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="complaintText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaint Details</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter your complaint here..." {...field} rows={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Unfair Treatment, Harassment" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div>
                  <Label htmlFor="evidence">Upload Evidence (Optional)</Label>
                  <Input id="evidence" type="file" multiple />
                </div>
                 <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={handleStandardizeComplaint} disabled={isRewriting}>
                    {isRewriting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Standardize with AI
                  </Button>
                  <Button type="submit">Submit Complaint</Button>
                </div>
              </form>
            </Form>
            {rewrittenComplaint && !isRewriting && (
              <Card className="mt-4 bg-secondary/50">
                <CardHeader>
                  <CardTitle className="text-base">AI Suggestion (Updated in Form)</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p>{rewrittenComplaint}</p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {(role === ROLES.DO || role === ROLES.HHRMD) && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Complaints</CardTitle>
            <CardDescription>Resolve or reject pending employee complaints.</CardDescription>
          </CardHeader>
          <CardContent>
            {mockPendingComplaints.length > 0 ? (
              mockPendingComplaints.map((complaint) => (
                <div key={complaint.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Complaint #{complaint.id} - {complaint.category}</h3>
                  <p className="text-sm text-muted-foreground">
                    Employee: {complaint.employeeName} {complaint.zanId ? `(ZanID: ${complaint.zanId})` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">Submitted: {complaint.submissionDate} by {complaint.submittedBy}</p>
                  <p className="text-sm mt-1"><strong>Details:</strong> {complaint.details}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{complaint.status}</span></p>
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    <Button size="sm">Resolve</Button>
                    <Button size="sm" variant="destructive">Reject</Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No complaints pending review.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
