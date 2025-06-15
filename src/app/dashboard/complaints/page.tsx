
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES, EMPLOYEES } from '@/lib/constants';
import React, { useState } from 'react';
import { standardizeComplaintFormatting } from '@/ai/flows/complaint-rewriter';
import type { ComplaintFormValues } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parseISO } from 'date-fns';

const complaintSchema = z.object({
  complaintText: z.string().min(10, "Complaint text must be at least 10 characters."),
  category: z.string().optional(),
});

interface MockPendingComplaint {
  id: string;
  employeeName: string; 
  zanId?: string; 
  department?: string;
  cadre?: string;
  employmentDate?: string;
  dateOfBirth?: string;
  institution?: string;
  category: string;
  details: string;
  submissionDate: string;
  submittedBy: string; 
  status: string;
  documents?: string[];
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: string;
}

const initialMockPendingComplaints: MockPendingComplaint[] = [
  {
    id: 'COMP001',
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    department: 'Finance',
    cadre: 'Accountant',
    employmentDate: "2018-09-15",
    dateOfBirth: "1988-02-10",
    institution: "Treasury Office",
    category: 'Unfair Treatment',
    details: 'Employee states that they were unfairly overlooked for a training opportunity despite meeting all criteria.',
    submissionDate: '2024-07-20',
    submittedBy: 'Fatma Said Omar (Employee)',
    status: 'Pending DO Review',
    documents: ['Evidence_Screenshot.png', 'Criteria_Doc.pdf'],
    reviewStage: 'initial',
  },
  {
    id: 'COMP002',
    employeeName: 'Ali Juma Ali',
    zanId: '221458232',
    department: 'Administration',
    cadre: 'Administrative Officer',
    employmentDate: "2023-01-10",
    dateOfBirth: "1980-05-15",
    institution: "Central Government Office",
    category: 'Workplace Safety',
    details: 'Complaint regarding inadequate safety equipment in the workshop, leading to a minor preventable incident.',
    submissionDate: '2024-07-18',
    submittedBy: 'Ali Juma Ali (Employee)',
    status: 'Pending HHRMD Review',
    reviewStage: 'initial',
  },
];


export default function ComplaintsPage() {
  const { role, user } = useAuth();
  const [rewrittenComplaint, setRewrittenComplaint] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  const [pendingComplaints, setPendingComplaints] = useState<MockPendingComplaint[]>(initialMockPendingComplaints);
  const [selectedRequest, setSelectedRequest] = useState<MockPendingComplaint | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockPendingComplaint | null>(null);

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
      form.setValue("complaintText", result.rewrittenComplaint); 
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
    // This mock submission would ideally add to the pendingComplaints list after HRO processes it
    toast({ title: "Complaint Submitted", description: "Your complaint has been successfully submitted. It will be reviewed by the relevant department." });
    form.reset();
    setRewrittenComplaint(null);
  };

  const handleInitialAction = (complaintId: string, action: 'forward' | 'reject') => {
    const complaint = pendingComplaints.find(c => c.id === complaintId);
    if (!complaint) return;

    if (action === 'reject') {
      setCurrentRequestToAction(complaint);
      setRejectionReasonInput('');
      setIsRejectionModalOpen(true);
    } else if (action === 'forward') {
      let toastMessage = "";
      setPendingComplaints(prevComplaints =>
        prevComplaints.map(c => {
          if (c.id === complaintId) {
            toastMessage = `Complaint ${complaintId} for ${c.employeeName} forwarded for Commission Review.`;
            return { ...c, status: "Awaiting Commission Review", reviewStage: 'commission_review', reviewedBy: role || undefined };
          }
          return c;
        })
      );
      if (toastMessage) {
        toast({ title: "Complaint Forwarded", description: toastMessage });
      }
    }
  };

  const handleRejectionSubmit = () => {
    if (!currentRequestToAction || !rejectionReasonInput.trim()) {
      toast({ title: "Rejection Error", description: "Reason for rejection is required.", variant: "destructive" });
      return;
    }
    const complaintId = currentRequestToAction.id;
    const employeeName = currentRequestToAction.employeeName;
    let toastMessage = "";

    setPendingComplaints(prevComplaints =>
      prevComplaints.map(c => {
        if (c.id === complaintId) {
          toastMessage = `Complaint ${complaintId} for ${employeeName} rejected and returned.`;
          return { ...c, status: `Rejected by ${role} - Awaiting HRO/Submitter Action`, rejectionReason: rejectionReasonInput, reviewStage: 'initial' };
        }
        return c;
      })
    );
    if (toastMessage) {
      toast({ title: "Complaint Rejected", description: toastMessage, variant: 'destructive' });
    }
    setIsRejectionModalOpen(false);
    setCurrentRequestToAction(null);
    setRejectionReasonInput('');
  };

  const handleCommissionDecision = (complaintId: string, decision: 'resolved_approved' | 'resolved_rejected') => {
    const complaint = pendingComplaints.find(c => c.id === complaintId);
    if (!complaint) return;

    const finalStatus = decision === 'resolved_approved' ? "Resolved - Approved by Commission" : "Resolved - Rejected by Commission";
    let toastMessage = "";
    setPendingComplaints(prevComplaints =>
      prevComplaints.map(c => {
        if (c.id === complaintId) {
          toastMessage = `Complaint ${complaintId} for ${c.employeeName} has been ${finalStatus.toLowerCase()}.`;
          return { ...c, status: finalStatus, reviewStage: 'completed' };
        }
        return c;
      })
    );
    if (toastMessage) {
      toast({ title: `Commission Decision: ${decision === 'resolved_approved' ? 'Approved' : 'Rejected'}`, description: toastMessage });
    }
  };

  return (
    <div>
      <PageHeader title="Complaints" description="Manage employee complaints and resolutions." />
      
      {role === ROLES.EMPLOYEE && (
        <Card className="mb-6 shadow-lg">
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
                  <Label htmlFor="evidence">Upload Evidence (Optional, PDF/Images)</Label>
                  <Input id="evidence" type="file" multiple accept=".pdf,.png,.jpg,.jpeg"/>
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
            {pendingComplaints.filter(c => 
              (role === ROLES.DO && c.status === 'Pending DO Review') ||
              (role === ROLES.HHRMD && c.status === 'Pending HHRMD Review') ||
              c.status === 'Awaiting Commission Review' ||
              c.status.startsWith('Rejected by') || c.status.startsWith('Resolved -')
            ).length > 0 ? (
              pendingComplaints.filter(c => 
                (role === ROLES.DO && c.status === 'Pending DO Review') ||
                (role === ROLES.HHRMD && c.status === 'Pending HHRMD Review') ||
                c.status === 'Awaiting Commission Review' ||
                c.status.startsWith('Rejected by') || c.status.startsWith('Resolved -')
              ).map((complaint) => (
                <div key={complaint.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-base">Complaint #{complaint.id} - {complaint.category}</h3>
                  <p className="text-sm text-muted-foreground">
                    Employee: {complaint.employeeName} {complaint.zanId ? `(ZanID: ${complaint.zanId})` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">Submitted: {complaint.submissionDate ? format(parseISO(complaint.submissionDate), 'PPP') : 'N/A'} by {complaint.submittedBy}</p>
                  <p className="text-sm mt-1"><strong>Details:</strong> {complaint.details}</p>
                  <p className="text-sm"><span className="font-medium">Status:</span> <span className="text-primary">{complaint.status}</span></p>
                  {complaint.rejectionReason && <p className="text-sm text-destructive"><span className="font-medium">Rejection Reason:</span> {complaint.rejectionReason}</p>}
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedRequest(complaint); setIsDetailsModalOpen(true); }}>View Details</Button>
                    {complaint.reviewStage === 'initial' && (complaint.status.startsWith(`Pending ${role} Review`)) && (
                      <>
                        <Button size="sm" onClick={() => handleInitialAction(complaint.id, 'forward')}>Verify &amp; Forward for Commission Review</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleInitialAction(complaint.id, 'reject')}>Reject Complaint</Button>
                      </>
                    )}
                    {complaint.reviewStage === 'commission_review' && complaint.status === 'Awaiting Commission Review' && complaint.reviewedBy === role && (
                        <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleCommissionDecision(complaint.id, 'resolved_approved')}>Resolve Complaint (Commission Approved)</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleCommissionDecision(complaint.id, 'resolved_rejected')}>Uphold Rejection (Commission Rejected)</Button>
                        </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No complaints pending your review.</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedRequest && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Complaint Details: {selectedRequest.id}</DialogTitle>
              <DialogDescription>
                Complaint from <strong>{selectedRequest.employeeName}</strong> {selectedRequest.zanId ? `(ZanID: ${selectedRequest.zanId})` : '(Anonymous/External)'}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
              {selectedRequest.zanId && ( 
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
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.department || 'N/A'}</p>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-x-4 gap-y-1">
                        <Label className="text-right text-muted-foreground">Cadre/Position:</Label>
                        <p className="col-span-2 font-medium text-foreground">{selectedRequest.cadre || 'N/A'}</p>
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
              )}

              <div className="space-y-1">
                <h4 className="font-semibold text-base text-foreground mb-2">Complaint Information</h4>
                <div className="grid grid-cols-3 items-center gap-x-4 gap-y-2">
                    <Label className="text-right font-semibold">Category:</Label>
                    <p className="col-span-2">{selectedRequest.category}</p>
                </div>
                <div className="grid grid-cols-3 items-start gap-x-4 gap-y-2">
                    <Label className="text-right font-semibold pt-1">Details:</Label>
                    <p className="col-span-2">{selectedRequest.details}</p>
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
                    <Label className="text-right font-semibold pt-1">Evidence Files:</Label>
                    <div className="col-span-2">
                    {selectedRequest.documents && selectedRequest.documents.length > 0 ? (
                        <ul className="list-disc pl-5 text-muted-foreground">
                        {selectedRequest.documents.map((doc, index) => <li key={index}>{doc}</li>)}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">No specific evidence files listed for this mock complaint.</p>
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
                    <DialogTitle>Reject Complaint: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the complaint from <strong>{currentRequestToAction.employeeName}</strong>. This reason will be visible to the submitter/HRO.
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

