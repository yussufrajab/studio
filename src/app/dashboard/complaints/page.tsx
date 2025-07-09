
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
import { standardizeComplaintFormatting } from '@/ai/flows/complaint-rewriter';
import type { Role as UserRole } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, Edit3, Send, CheckCircle, XCircle, Info, MessageSquarePlus, Edit, Filter, Phone, Users, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';

const COMPLAINT_TYPES = [
  "Harassment",
  "Promotion Delay",
  "Confirmation delay",
  "Unfair Treatment",
  "unfair decision",
  "Workplace Safety",
  "Discrimination",
  "Other",
];

const phoneValidation = z.string({ required_error: "Phone number is required."})
  .length(10, { message: "Phone number must be exactly 10 digits." })
  .startsWith("0", { message: "Phone number must start with '0'." })
  .regex(/^[0-9]+$/, { message: "Invalid characters. Only digits are allowed." });

const complaintSchema = z.object({
  complaintType: z.string().min(1, "Complaint type is required."),
  subject: z.string().min(5, "Subject must be at least 5 characters.").max(100, "Subject must be 100 characters or less."),
  complaintText: z.string().min(20, "Complaint description must be at least 20 characters."),
  complainantPhoneNumber: phoneValidation,
  nextOfKinPhoneNumber: phoneValidation,
  evidence: z.custom<FileList | null>().optional(),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

interface SubmittedComplaint {
  id: string;
  employeeId?: string | null;
  employeeName: string; 
  zanId?: string | null; 
  department?: string | null;
  cadre?: string | null;
  complaintType: string;
  subject: string;
  details: string; 
  complainantPhoneNumber?: string;
  nextOfKinPhoneNumber?: string;
  submissionDate: string;
  status: string;
  attachments?: string[]; 
  officerComments?: string | null;
  internalNotes?: string | null;
  assignedOfficerRole?: string | null;
  reviewStage: string;
  rejectionReason?: string | null;
  reviewedBy?: UserRole | null;
}

export default function ComplaintsPage() {
  const { role, user } = useAuth();
  const [rewrittenComplaint, setRewrittenComplaint] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [complaints, setComplaints] = useState<SubmittedComplaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<SubmittedComplaint | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [isActionModalOpen, setIsActionModalOpen] = useState(false); 
  const [officerActionComment, setOfficerActionComment] = useState('');
  const [officerInternalNote, setOfficerInternalNote] = useState(''); 
  const [actionType, setActionType] = useState<"resolve" | "request_info" | null>(null);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false); 
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<SubmittedComplaint | null>(null);


  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      complaintType: "",
      subject: "",
      complaintText: "",
      complainantPhoneNumber: "",
      nextOfKinPhoneNumber: "",
      evidence: null,
    },
  });
  
  useEffect(() => {
    const fetchComplaints = async () => {
        if (!user || !role) return;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/complaints?userId=${user.id}&userRole=${role}`);
            if (!response.ok) {
                throw new Error('Failed to fetch complaints');
            }
            const data = await response.json();
            setComplaints(data);
        } catch (error) {
            toast({ title: "Error", description: "Could not load complaints.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    fetchComplaints();
  }, [user, role]);


  const handleStandardizeComplaint = async () => {
    const complaintText = form.getValues("complaintText");
    if (!complaintText) {
      toast({ title: "Rewrite Error", description: "Please enter your complaint description first.", variant: "destructive" });
      return;
    }
    setIsRewriting(true);
    setRewrittenComplaint(null);
    try {
      const result = await standardizeComplaintFormatting({ complaintText });
      setRewrittenComplaint(result.rewrittenComplaint);
      form.setValue("complaintText", result.rewrittenComplaint, { shouldValidate: true }); 
      toast({ title: "Complaint Standardized", description: "AI has rewritten your complaint description for clarity and compliance. It has been updated in the form." });
    } catch (error) {
      console.error("AI Rewrite Error:", error);
      toast({ title: "Rewrite Failed", description: "Could not standardize the complaint using AI.", variant: "destructive" });
    } finally {
      setIsRewriting(false);
    }
  };
  
  const onEmployeeSubmit = async (data: ComplaintFormValues) => {
    if (!user) {
      toast({title: "Error", description: "User information not found.", variant: "destructive"});
      return;
    }
    setIsSubmitting(true);
    
    // In a real app, file upload would be handled here, e.g., to a cloud storage service.
    // For this prototype, we'll just pass the file names.
    const attachmentNames = data.evidence ? Array.from(data.evidence).map(file => file.name) : [];
    
    try {
        const response = await fetch('/api/complaints', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, attachments: attachmentNames, complainantId: user.id }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit complaint');
        }

        const newComplaint = await response.json();
        
        setComplaints(prev => [newComplaint, ...prev]);
        toast({ title: "Complaint Submitted", description: "Your complaint has been successfully submitted." });
        form.reset();
        setRewrittenComplaint(null);
    } catch (error) {
        toast({ title: "Submission Failed", description: "An error occurred while submitting your complaint.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const updateComplaintState = (updatedComplaint: SubmittedComplaint) => {
      setComplaints(prev => prev.map(c => c.id === updatedComplaint.id ? { ...c, ...updatedComplaint } : c));
  };

  const handleUpdateComplaint = async (complaintId: string, payload: any) => {
      try {
          const response = await fetch(`/api/complaints/${complaintId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (!response.ok) throw new Error('Failed to update complaint');
          const updatedComplaint = await response.json();
          updateComplaintState(updatedComplaint);
          return updatedComplaint;
      } catch (error) {
          toast({ title: "Update Failed", description: "Could not update the complaint.", variant: "destructive" });
          return null;
      }
  };


  const handleInitialAction = async (complaintId: string, action: 'forward' | 'reject_initial') => {
    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) return;

    if (action === 'reject_initial') {
      setCurrentRequestToAction(complaint);
      setRejectionReasonInput(''); 
      setIsRejectionModalOpen(true);
    } else if (action === 'forward') {
      const payload = { 
        status: "Awaiting Commission Review", 
        reviewStage: 'commission_review', 
        reviewedById: user?.id 
      };
      const updated = await handleUpdateComplaint(complaintId, payload);
      if (updated) {
        toast({ title: "Complaint Forwarded", description: `Complaint ${complaintId} forwarded for Commission Review.` });
      }
    }
  };
  
  const handleRejectionSubmit = async () => {
    if (!currentRequestToAction || !rejectionReasonInput.trim()) {
      toast({ title: "Rejection Error", description: "Reason for rejection is required.", variant: "destructive" });
      return;
    }
    const { id, employeeName } = currentRequestToAction;
    const rejectedByRole = role === ROLES.DO ? "DO" : "HHRMD";

    const payload = {
        status: `Rejected by ${rejectedByRole} - Awaiting HRO/Submitter Action`,
        rejectionReason: rejectionReasonInput,
        reviewStage: 'initial',
        reviewedById: user?.id
    };

    const updated = await handleUpdateComplaint(id, payload);
    if (updated) {
        toast({ title: "Complaint Rejected", description: `Complaint ${id} for ${employeeName} rejected.`, variant: 'destructive' });
        setIsRejectionModalOpen(false);
        setCurrentRequestToAction(null);
        setRejectionReasonInput('');
    }
  };

  const handleCommissionDecision = async (complaintId: string, decision: 'commission_approve' | 'commission_reject') => {
    const finalStatus = decision === 'commission_approve' ? "Resolved - Approved by Commission" : "Resolved - Rejected by Commission";
    const payload = { status: finalStatus, reviewStage: 'completed', reviewedById: user?.id };
    
    const updated = await handleUpdateComplaint(complaintId, payload);
    if (updated) {
       toast({ title: `Commission Decision: ${decision === 'commission_approve' ? 'Approved' : 'Rejected'}`, description: `Complaint ${complaintId} updated.` });
    }
  };

  const openActionModal = (complaint: SubmittedComplaint, type: "resolve" | "request_info") => {
    setSelectedComplaint(complaint);
    setActionType(type); 
    setOfficerActionComment(complaint.officerComments || '');
    setOfficerInternalNote(complaint.internalNotes || '');
    setIsActionModalOpen(true);
  };
  
  const handleOfficerSubmitLegacyAction = async () => {
    if (!selectedComplaint || !actionType || !officerActionComment.trim()) {
      toast({title: "Action Error", description: "Officer comments are required.", variant: "destructive"});
      return;
    }

    let newStatus: string = selectedComplaint.status;
    let toastMessage = "";

    if (actionType === 'resolve') {
      newStatus = "Resolved - Pending Employee Confirmation";
      toastMessage = `Complaint ${selectedComplaint.id} marked as Resolved.`;
    } else if (actionType === 'request_info') {
      newStatus = "Awaiting More Information";
      toastMessage = `More information requested for complaint ${selectedComplaint.id}.`;
    }
    
    const payload = {
        status: newStatus,
        officerComments: officerActionComment,
        internalNotes: officerInternalNote,
        assignedOfficerRole: role,
        reviewStage: 'completed',
        reviewedById: user?.id
    };

    const updated = await handleUpdateComplaint(selectedComplaint.id, payload);

    if (updated) {
      toast({ title: "Action Taken", description: toastMessage });
      setIsActionModalOpen(false);
      setSelectedComplaint(null);
      setOfficerActionComment('');
      setOfficerInternalNote('');
      setActionType(null);
    }
  };

  const handleEmployeeConfirmOutcome = async (complaintId: string) => {
    const payload = { status: "Closed - Satisfied" };
    const updated = await handleUpdateComplaint(complaintId, payload);
    if (updated) {
      toast({title: "Complaint Closed", description: "Thank you for your feedback."});
    }
  };
  
  const complaintsForOfficerReview = complaints.filter(c => c.assignedOfficerRole === role);
  const employeeSubmittedComplaints = complaints.filter(c => c.employeeId === user?.employeeId);

  return (
    <div>
      <PageHeader title="Complaints Management" description="Submit, view, and manage employee complaints." />
      
      {role === ROLES.EMPLOYEE && (
        <>
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle>Submit a New Complaint</CardTitle>
            <CardDescription>Describe your complaint clearly. You can use the AI tool to help standardize the text for the description field.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEmployeeSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="complaintType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Complaint Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select the type of your complaint" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {COMPLAINT_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject / Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Briefly summarize your complaint" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="complaintText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Detailed Description *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide a full description of your complaint..." {...field} rows={6} />
                      </FormControl>
                       <p className="text-sm text-muted-foreground pt-1">
                        You can use the AI tool below to help refine your description for clarity and compliance.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="complainantPhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-primary"/>Your Current Phone Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter your phone number, e.g., 0777123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nextOfKinPhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-primary"/>Next of Kin / Guarantor Phone Number *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter next of kin's phone number, e.g., 0777123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="evidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Upload Attachments (Optional, PDF/Images)</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          multiple 
                          accept=".pdf,.png,.jpg,.jpeg"
                          onChange={(e) => field.onChange(e.target.files)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                  <Button type="button" variant="outline" onClick={handleStandardizeComplaint} disabled={isRewriting}>
                    {isRewriting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit3 className="mr-2 h-4 w-4"/>}
                    Standardize Description with AI
                  </Button>
                  <Button type="submit" disabled={isRewriting || isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4"/>}
                    Submit Complaint
                  </Button>
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

        <Card className="shadow-lg mt-8">
            <CardHeader>
                <CardTitle>My Submitted Complaints</CardTitle>
                <CardDescription>Track the status of complaints you have submitted.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : employeeSubmittedComplaints.length > 0 ? (
                    employeeSubmittedComplaints.map(complaint => (
                        <div key={complaint.id} className="mb-4 border p-4 rounded-md space-y-3 shadow-sm bg-background hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-base">{complaint.subject}</h3>
                                    <p className="text-sm text-muted-foreground">Type: {complaint.complaintType} | Submitted: {format(parseISO(complaint.submissionDate), 'PPP')}</p>
                                </div>
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                    complaint.status === "Closed - Satisfied" ? "bg-green-100 text-green-700" :
                                    complaint.status.startsWith("Resolved") ? "bg-blue-100 text-blue-700" :
                                    complaint.status.startsWith("Rejected") ? "bg-red-100 text-red-700" :
                                    complaint.status === "Awaiting More Information" ? "bg-yellow-100 text-yellow-700" :
                                    "bg-gray-100 text-gray-700"
                                }`}>{complaint.status}</span>
                            </div>
                            <p className="text-sm "><strong className="text-muted-foreground">Details:</strong> {complaint.details.substring(0,150)}{complaint.details.length > 150 ? '...' : ''}</p>
                            {complaint.officerComments && (complaint.status.startsWith("Resolved") || complaint.status.startsWith("Rejected by") || complaint.status === "Awaiting More Information") && (
                                <Card className="mt-2 bg-secondary/30">
                                    <CardHeader className="pb-1 pt-2">
                                        <CardTitle className="text-sm font-medium">Officer's Feedback / Reason:</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <p className="text-sm text-muted-foreground">{complaint.officerComments}</p>
                                    </CardContent>
                                </Card>
                            )}
                            {complaint.rejectionReason && (complaint.status.startsWith("Rejected by") || complaint.status === "Resolved - Rejected by Commission") && (
                                <Card className="mt-2 bg-red-50 border-red-200">
                                    <CardHeader className="pb-1 pt-2">
                                        <CardTitle className="text-sm font-medium text-red-700">Reason for Rejection:</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <p className="text-sm text-red-600">{complaint.rejectionReason}</p>
                                    </CardContent>
                                </Card>
                            )}
                            {(complaint.status === "Resolved - Pending Employee Confirmation" || complaint.status === "Rejected - Pending Employee Confirmation" || complaint.status === "Resolved - Approved by Commission" || complaint.status === "Resolved - Rejected by Commission") && (
                                <div className="mt-3 pt-3 border-t">
                                    <Button size="sm" onClick={() => handleEmployeeConfirmOutcome(complaint.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                        <CheckCircle className="mr-2 h-4 w-4"/>
                                        Confirm Outcome and Close Complaint
                                    </Button>
                                </div>
                            )}
                             {complaint.status === "Awaiting More Information" && (
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-sm text-amber-700 font-medium">The reviewing officer has requested more information. Please review their comments and contact the relevant office to provide the necessary details if this has not been done through other channels.</p>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground">You have not submitted any complaints yet.</p>
                )}
            </CardContent>
        </Card>
        </>
      )}

      {(role === ROLES.DO || role === ROLES.HHRMD) && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Review Submitted Complaints</CardTitle>
            <CardDescription>Review, take action, or request more information on employee complaints assigned to your role.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                 <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : complaintsForOfficerReview.length > 0 ? (
              complaintsForOfficerReview.map((complaint) => (
                <div key={complaint.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-base">{complaint.subject} (Type: {complaint.complaintType})</h3>
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        complaint.status === "Submitted" ? "bg-orange-100 text-orange-700" : 
                        complaint.status === "Under Review" ? "bg-blue-100 text-blue-700" :
                        complaint.status === "Awaiting Commission Review" ? "bg-purple-100 text-purple-700" :
                        complaint.status.startsWith("Resolved") ? "bg-green-100 text-green-700" :
                        complaint.status.startsWith("Rejected") ? "bg-red-100 text-red-700" :
                        "bg-gray-100 text-gray-700"
                    }`}>{complaint.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From: {complaint.employeeName} {complaint.zanId ? `(ZanID: ${complaint.zanId})` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">Submitted: {format(parseISO(complaint.submissionDate), 'PPP')}</p>
                  <p className="text-sm mt-1"><strong>Details Preview:</strong> {complaint.details.substring(0, 150)}{complaint.details.length > 150 ? "..." : ""}</p>
                  {complaint.rejectionReason && <p className="text-sm text-destructive"><span className="font-medium">Rejection Reason:</span> {complaint.rejectionReason}</p>}
                  
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedComplaint(complaint); setIsDetailsModalOpen(true); }}>
                        <Eye className="mr-2 h-4 w-4"/>View Full Details
                    </Button>
                    {complaint.reviewStage === 'initial' && (complaint.status === "Submitted" || complaint.status === "Under Review") && (
                      <>
                        <Button size="sm" onClick={() => handleInitialAction(complaint.id, 'forward')}>Verify &amp; Forward for Commission Review</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleInitialAction(complaint.id, 'reject_initial')}>Reject Complaint</Button>
                        <Button size="sm" variant="secondary" onClick={() => openActionModal(complaint, "request_info")}>
                            <Info className="mr-2 h-4 w-4"/>Request More Info
                        </Button>
                         <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openActionModal(complaint, "resolve")}>
                            <CheckCircle className="mr-2 h-4 w-4"/>Mark Resolved (Direct)
                        </Button>
                      </>
                    )}
                    {complaint.reviewStage === 'commission_review' && complaint.status === "Awaiting Commission Review" && complaint.reviewedBy === role && (
                        <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleCommissionDecision(complaint.id, 'commission_approve')}>Resolve (Commission Approved)</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleCommissionDecision(complaint.id, 'commission_reject')}>Reject (Commission Rejected)</Button>
                        </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No complaints currently assigned or pending your review.</p>
            )}
          </CardContent>
        </Card>
      )}

      {selectedComplaint && isDetailsModalOpen && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Complaint Details: {selectedComplaint.id}</DialogTitle>
              <DialogDescription>
                From: <strong>{selectedComplaint.employeeName}</strong> ({selectedComplaint.zanId || 'N/A'}) | Type: {selectedComplaint.complaintType}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm max-h-[70vh] overflow-y-auto">
              <div><strong className="text-muted-foreground">Subject:</strong> <p className="mt-1">{selectedComplaint.subject}</p></div>
              <div><strong className="text-muted-foreground">Full Description:</strong> <p className="mt-1 whitespace-pre-wrap">{selectedComplaint.details}</p></div>
              <div><strong className="text-muted-foreground">Submitted On:</strong> {format(parseISO(selectedComplaint.submissionDate), 'PPP p')}</div>
              <div><strong className="text-muted-foreground">Status:</strong> <span className="text-primary">{selectedComplaint.status}</span></div>
              
              {(role === ROLES.DO || role === ROLES.HHRMD) && (
                <Card className="mt-3 bg-blue-50 border-blue-200">
                  <CardHeader className="pb-2 pt-3">
                    <CardTitle className="text-base text-blue-700">Contact Information (Confidential)</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs space-y-1 pb-3">
                    <p><strong>Complainant Phone:</strong> {selectedComplaint.complainantPhoneNumber || 'Not Provided'}</p>
                    <p><strong>Next of Kin Phone:</strong> {selectedComplaint.nextOfKinPhoneNumber || 'Not Provided'}</p>
                  </CardContent>
                </Card>
              )}

              {selectedComplaint.zanId && (
                <Card className="mt-3 bg-secondary/20">
                    <CardHeader className="pb-2 pt-3">
                        <CardTitle className="text-base">Employee Information</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs space-y-1 pb-3">
                        <p><strong>Department:</strong> {selectedComplaint.department || 'N/A'}</p>
                        <p><strong>Cadre/Position:</strong> {selectedComplaint.cadre || 'N/A'}</p>
                    </CardContent>
                </Card>
              )}

               <div className="pt-3 mt-3 border-t">
                    <Label className="font-semibold">Attached Documents</Label>
                    <div className="mt-2 space-y-2">
                    {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 ? (
                        selectedComplaint.attachments.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-secondary/50 text-sm">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-foreground truncate" title={doc}>{doc}</span>
                                </div>
                                <Button asChild variant="link" size="sm" className="h-auto p-0 flex-shrink-0">
                                    <a href="#" onClick={(e) => e.preventDefault()} target="_blank" rel="noopener noreferrer">View Document</a>
                                </Button>
                            </div>
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">No documents were attached to this request.</p>
                    )}
                    </div>
                </div>

               {selectedComplaint.officerComments && (
                <div className="mt-2 pt-2 border-t">
                  <strong className="text-muted-foreground">Officer's Comments/Feedback:</strong>
                  <p className="mt-1 whitespace-pre-wrap">{selectedComplaint.officerComments}</p>
                </div>
              )}
              {selectedComplaint.rejectionReason && (
                <div className="mt-2 pt-2 border-t">
                  <strong className="text-muted-foreground text-destructive">Reason for Rejection:</strong>
                  <p className="mt-1 whitespace-pre-wrap text-destructive">{selectedComplaint.rejectionReason}</p>
                </div>
              )}
              {selectedComplaint.internalNotes && (
                <div className="mt-2 pt-2 border-t">
                  <strong className="text-muted-foreground">Internal Notes:</strong>
                  <p className="mt-1 whitespace-pre-wrap bg-yellow-50 p-2 rounded border border-yellow-200">{selectedComplaint.internalNotes}</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

       {selectedComplaint && isActionModalOpen && (actionType === 'resolve' || actionType === 'request_info') && (
        <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {actionType === 'resolve' && "Resolve Complaint Directly"}
                        {actionType === 'request_info' && "Request More Information"}
                        : {selectedComplaint.id}
                    </DialogTitle>
                    <DialogDescription>
                        For complaint by <strong>{selectedComplaint.employeeName}</strong>. 
                        {actionType === 'request_info' ? " Specify what additional information is needed from the employee." : " Provide your comments/reason for this action."}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <Label htmlFor="officerActionCommentLegacy">
                            {actionType === 'request_info' ? "Information/Clarification Needed from Employee:" : "Officer Comments / Reason for Action:"}
                        </Label>
                        <Textarea
                            id="officerActionCommentLegacy"
                            placeholder="Enter your comments here..."
                            value={officerActionComment}
                            onChange={(e) => setOfficerActionComment(e.target.value)}
                            rows={5}
                            className="mt-1"
                        />
                    </div>
                     <div>
                        <Label htmlFor="officerInternalNoteLegacy">Internal Notes (Optional, for record keeping)</Label>
                        <Textarea
                            id="officerInternalNoteLegacy"
                            placeholder="Add any internal notes here..."
                            value={officerInternalNote}
                            onChange={(e) => setOfficerInternalNote(e.target.value)}
                            rows={3}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="officerAttachmentLegacy">Attach Official Response Document (Optional, PDF only)</Label>
                        <Input id="officerAttachmentLegacy" type="file" accept=".pdf" className="mt-1"/>
                        <p className="text-xs text-muted-foreground mt-1">
                            This is a placeholder. File upload logic is not fully implemented in this mock.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsActionModalOpen(false); setSelectedComplaint(null); setActionType(null); }}>Cancel</Button>
                    <Button 
                        onClick={handleOfficerSubmitLegacyAction} 
                        disabled={!officerActionComment.trim()}
                        className={
                            actionType === 'resolve' ? "bg-green-600 hover:bg-green-700 text-white" :
                            "" 
                        }
                    >
                        {actionType === 'resolve' && <><CheckCircle className="mr-2 h-4 w-4"/>Confirm Resolution</>}
                        {actionType === 'request_info' && <><MessageSquarePlus className="mr-2 h-4 w-4"/>Send Request for Information</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

      {currentRequestToAction && isRejectionModalOpen && (
        <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Reject Complaint: {currentRequestToAction.id}</DialogTitle>
                    <DialogDescription>
                        Please provide the reason for rejecting the complaint by <strong>{currentRequestToAction.employeeName}</strong>. This reason will be visible.
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
                    <Button variant="outline" onClick={() => { setIsRejectionModalOpen(false); setCurrentRequestToAction(null); setRejectionReasonInput(''); }}>Cancel</Button>
                    <Button variant="destructive" onClick={handleRejectionSubmit} disabled={!rejectionReasonInput.trim()}>Submit Rejection</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
