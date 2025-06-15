
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
import { Loader2, Eye, Edit3, Send, CheckCircle, XCircle, Info, MessageSquarePlus, Edit, Filter, Phone, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';

const COMPLAINT_TYPES = [
  "Harassment",
  "Salary Issue",
  "Promotion Delay",
  "Unfair Treatment",
  "Workplace Safety",
  "Discrimination",
  "Other",
];

const complaintSchema = z.object({
  complaintType: z.string().min(1, "Complaint type is required."),
  subject: z.string().min(5, "Subject must be at least 5 characters.").max(100, "Subject must be 100 characters or less."),
  complaintText: z.string().min(20, "Complaint description must be at least 20 characters."),
  complainantPhoneNumber: z.string().optional(),
  nextOfKinPhoneNumber: z.string().optional(),
  evidence: z.custom<FileList | null>().optional(),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

interface MockSubmittedComplaint {
  id: string;
  employeeId: string; 
  employeeName: string; 
  zanId?: string; 
  department?: string;
  cadre?: string;
  complaintType: string;
  subject: string;
  details: string; 
  complainantPhoneNumber?: string;
  nextOfKinPhoneNumber?: string;
  submissionDate: string;
  status: "Submitted" | "Under Review" | "Awaiting More Information" | "Resolved - Pending Employee Confirmation" | "Rejected - Pending Employee Confirmation" | "Closed - Satisfied" | "Awaiting Commission Review" | "Resolved - Approved by Commission" | "Resolved - Rejected by Commission" | "Rejected by DO - Awaiting HRO/Submitter Action" | "Rejected by HHRMD - Awaiting HRO/Submitter Action";
  attachments?: string[]; 
  officerComments?: string;
  internalNotes?: string; 
  assignedOfficerRole?: typeof ROLES.DO | typeof ROLES.HHRMD; 
  reviewStage: 'initial' | 'commission_review' | 'completed';
  rejectionReason?: string;
  reviewedBy?: UserRole;
}

const initialMockComplaints: MockSubmittedComplaint[] = [
  {
    id: 'COMP001',
    employeeId: 'emp3', 
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    department: 'Finance',
    cadre: 'Accountant',
    complaintType: 'Unfair Treatment',
    subject: 'Overlooked for Training Opportunity',
    details: 'Employee states that they were unfairly overlooked for a training opportunity despite meeting all criteria and having relevant experience. This has happened multiple times.',
    complainantPhoneNumber: '0777123456',
    nextOfKinPhoneNumber: '0777654321',
    submissionDate: '2024-07-20',
    status: 'Submitted',
    attachments: ['Evidence_Screenshot.png', 'Criteria_Doc.pdf'],
    assignedOfficerRole: ROLES.DO,
    reviewStage: 'initial',
  },
  {
    id: 'COMP002',
    employeeId: 'emp1', 
    employeeName: 'Ali Juma Ali',
    zanId: '221458232',
    department: 'Administration',
    cadre: 'Administrative Officer',
    complaintType: 'Workplace Safety',
    subject: 'Inadequate Safety Equipment',
    details: 'Complaint regarding inadequate safety equipment in the workshop, leading to a minor preventable incident. Requesting immediate inspection and provision of necessary gear.',
    submissionDate: '2024-07-18',
    status: 'Under Review',
    assignedOfficerRole: ROLES.HHRMD,
    internalNotes: "Forwarded to safety committee for initial assessment. Photos of workshop attached internally.",
    reviewStage: 'initial',
  },
  {
    id: 'COMP003',
    employeeId: 'emp7', 
    employeeName: 'Hamid Mohamed',
    zanId: '778901234', 
    department: 'Transport',
    cadre: 'Senior Driver',
    complaintType: 'Salary Issue',
    subject: 'Incorrect Overtime Payment',
    details: 'My overtime for the past two months has been calculated incorrectly. I have attached my timesheets and pay slips for review.',
    complainantPhoneNumber: '0773987654',
    submissionDate: '2024-07-25',
    status: 'Resolved - Pending Employee Confirmation',
    attachments: ['Timesheet_June.pdf', 'Payslip_June.pdf', 'Timesheet_July.pdf', 'Payslip_July.pdf'],
    officerComments: "We reviewed your timesheets and found an error in the overtime calculation due to a system glitch. This has been corrected, and the outstanding amount will be included in your next paycheck. We apologize for the inconvenience.",
    assignedOfficerRole: ROLES.HHRMD,
    reviewStage: 'completed',
  },
   {
    id: 'COMP004',
    employeeId: 'emp2', 
    employeeName: 'Safia Juma Ali',
    zanId: '125468957',
    department: 'Human Resources',
    cadre: 'HR Officer',
    complaintType: 'Promotion Delay',
    subject: 'Enquiry about Promotion Application Status',
    details: 'I submitted my application for promotion to Senior HR Officer three months ago and have not received any update. Could you please provide information on the status of my application?',
    submissionDate: '2024-05-10',
    status: 'Awaiting More Information',
    officerComments: "Thank you for your enquiry. To assist you better, could you please provide the submission ID or exact date you submitted your promotion application?",
    assignedOfficerRole: ROLES.DO,
    reviewStage: 'initial',
  },
];


export default function ComplaintsPage() {
  const { role, user } = useAuth();
  const [rewrittenComplaint, setRewrittenComplaint] = useState<string | null>(null);
  const [isRewriting, setIsRewriting] = useState(false);

  const [complaints, setComplaints] = useState<MockSubmittedComplaint[]>(initialMockComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<MockSubmittedComplaint | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [isActionModalOpen, setIsActionModalOpen] = useState(false); 
  const [officerActionComment, setOfficerActionComment] = useState('');
  const [officerInternalNote, setOfficerInternalNote] = useState(''); 
  const [actionType, setActionType] = useState<"resolve" | "request_info" | null>(null);

  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false); 
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [currentRequestToAction, setCurrentRequestToAction] = useState<MockSubmittedComplaint | null>(null);


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
  
  const employeeSubmittedComplaints = complaints.filter(c => c.employeeId === user?.employeeId);

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
  
  const onEmployeeSubmit = (data: ComplaintFormValues) => {
    if (!user || !user.employeeId) {
      toast({title: "Error", description: "User information not found.", variant: "destructive"});
      return;
    }
    const employeeSubmitting = EMPLOYEES.find(e => e.id === user.employeeId);

    const newComplaint: MockSubmittedComplaint = {
      id: `COMP${Date.now().toString().slice(-4)}`,
      employeeId: user.employeeId,
      employeeName: user.name,
      zanId: employeeSubmitting?.zanId,
      department: employeeSubmitting?.department,
      cadre: employeeSubmitting?.cadre,
      complaintType: data.complaintType,
      subject: data.subject,
      details: data.complaintText,
      complainantPhoneNumber: data.complainantPhoneNumber,
      nextOfKinPhoneNumber: data.nextOfKinPhoneNumber,
      submissionDate: new Date().toISOString().split('T')[0], 
      status: "Submitted",
      attachments: data.evidence ? Array.from(data.evidence).map(file => file.name) : [],
      assignedOfficerRole: ROLES.DO, 
      reviewStage: 'initial',
    };

    setComplaints(prev => [newComplaint, ...prev]);
    toast({ title: "Complaint Submitted", description: "Your complaint has been successfully submitted. It will be reviewed by the relevant department." });
    form.reset();
    setRewrittenComplaint(null);
  };

  const handleInitialAction = (complaintId: string, action: 'forward' | 'reject_initial') => {
    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) return;

    if (action === 'reject_initial') {
      setCurrentRequestToAction(complaint);
      setRejectionReasonInput(''); 
      setIsRejectionModalOpen(true);
    } else if (action === 'forward') {
      let toastMessage = "";
      setComplaints(prevComplaints =>
        prevComplaints.map(c => {
          if (c.id === complaintId) {
            toastMessage = `Complaint ${complaintId} for ${c.employeeName} forwarded for Commission Review.`;
            return { 
              ...c, 
              status: "Awaiting Commission Review", 
              reviewStage: 'commission_review', 
              reviewedBy: role as UserRole || undefined 
            };
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
    const rejectedByRole = role === ROLES.DO ? "DO" : "HHRMD";


    setComplaints(prevComplaints =>
      prevComplaints.map(c => {
        if (c.id === complaintId) {
          toastMessage = `Complaint ${complaintId} for ${employeeName} rejected and returned.`;
          return { 
            ...c, 
            status: `Rejected by ${rejectedByRole} - Awaiting HRO/Submitter Action` as MockSubmittedComplaint['status'], 
            rejectionReason: rejectionReasonInput, 
            reviewStage: 'initial' 
          };
        }
        return c;
      })
    );
    if(toastMessage) {
        toast({ title: "Complaint Rejected", description: toastMessage, variant: 'destructive' });
    }
    setIsRejectionModalOpen(false);
    setCurrentRequestToAction(null);
    setRejectionReasonInput('');
  };

  const handleCommissionDecision = (complaintId: string, decision: 'commission_approve' | 'commission_reject') => {
    const complaint = complaints.find(c => c.id === complaintId);
    if (!complaint) return;
    let toastMessage = "";
    let finalStatus: MockSubmittedComplaint['status'] = complaint.status;

    if (decision === 'commission_approve') {
        finalStatus = "Resolved - Approved by Commission";
    } else {
        finalStatus = "Resolved - Rejected by Commission";
    }
    
    setComplaints(prevComplaints =>
      prevComplaints.map(c => {
        if (c.id === complaintId) {
           toastMessage = `Complaint ${complaintId} for ${c.employeeName} has been ${decision === 'commission_approve' ? 'approved' : 'rejected'} by Commission.`;
          return { ...c, status: finalStatus, reviewStage: 'completed' };
        }
        return c;
      })
    );
    if (toastMessage) {
        toast({ title: `Commission Decision: ${decision === 'commission_approve' ? 'Approved' : 'Rejected'}`, description: toastMessage });
    }
  };


  const openActionModal = (complaint: MockSubmittedComplaint, type: "resolve" | "request_info") => {
    setSelectedComplaint(complaint);
    setActionType(type); 
    setOfficerActionComment(complaint.officerComments || '');
    setOfficerInternalNote(complaint.internalNotes || '');
    setIsActionModalOpen(true);
  };
  
  const handleOfficerSubmitLegacyAction = () => {
    if (!selectedComplaint || !actionType || !officerActionComment.trim()) {
      toast({title: "Action Error", description: "Officer comments are required to proceed.", variant: "destructive"});
      return;
    }

    let newStatus: MockSubmittedComplaint['status'] = selectedComplaint.status;
    let toastMessage = "";

    if (actionType === 'resolve') {
      newStatus = "Resolved - Pending Employee Confirmation";
      toastMessage = `Complaint ${selectedComplaint.id} marked as Resolved.`;
    } else if (actionType === 'request_info') {
      newStatus = "Awaiting More Information";
      toastMessage = `More information requested for complaint ${selectedComplaint.id}.`;
    } else {
        console.warn("Unhandled legacy action type:", actionType);
        return;
    }
    
    let updatedComplaint: MockSubmittedComplaint | null = null;
    setComplaints(prevComplaints =>
      prevComplaints.map(c => {
        if (c.id === selectedComplaint.id) {
          updatedComplaint = { 
            ...c, 
            status: newStatus, 
            officerComments: officerActionComment, 
            internalNotes: officerInternalNote, 
            assignedOfficerRole: role as typeof ROLES.DO | typeof ROLES.HHRMD,
            reviewStage: 'completed' 
          };
          return updatedComplaint;
        }
        return c;
      })
    );
    
    if (toastMessage) {
      toast({ title: "Action Taken", description: toastMessage });
    }
    setIsActionModalOpen(false);
    setSelectedComplaint(null);
    setOfficerActionComment('');
    setOfficerInternalNote('');
    setActionType(null);
  };


  const handleEmployeeConfirmOutcome = (complaintId: string) => {
    let toastMessage = "";
    setComplaints(prevComplaints =>
      prevComplaints.map(c => {
        if (c.id === complaintId) {
          toastMessage = "Thank you for your feedback. The complaint has been closed.";
          return { ...c, status: "Closed - Satisfied" };
        }
        return c;
      })
    );
    if (toastMessage) {
      toast({title: "Complaint Closed", description: toastMessage});
    }
  };
  
  const complaintsForOfficerReview = complaints.filter(c => 
    (role === ROLES.DO && c.assignedOfficerRole === ROLES.DO) ||
    (role === ROLES.HHRMD && c.assignedOfficerRole === ROLES.HHRMD)
  );

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
                      <FormLabel className="flex items-center"><Phone className="mr-2 h-4 w-4 text-primary"/>Your Current Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter your phone number" {...field} />
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
                      <FormLabel className="flex items-center"><Users className="mr-2 h-4 w-4 text-primary"/>Next of Kin / Guarantor Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter next of kin's phone number" {...field} />
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
                  <Button type="submit" disabled={isRewriting}>
                    <Send className="mr-2 h-4 w-4"/>
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
                {employeeSubmittedComplaints.length > 0 ? (
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
            {complaintsForOfficerReview.filter(c => c.status !== "Closed - Satisfied").length > 0 ? (
              complaintsForOfficerReview.filter(c => c.status !== "Closed - Satisfied").map((complaint) => (
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

              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div>
                  <strong className="text-muted-foreground">Attachments:</strong>
                  <ul className="list-disc pl-5 mt-1 text-muted-foreground">
                    {selectedComplaint.attachments.map((doc, index) => <li key={index}>{doc} (mock link)</li>)}
                  </ul>
                </div>
              )}
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

