
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
import type { ComplaintFormValues as OriginalComplaintFormValues } from '@/lib/types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { toast } from '@/hooks/use-toast';
import { Loader2, Eye, Edit3, Send, CheckCircle, XCircle, Info, MessageSquarePlus, Edit } from 'lucide-react';
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
  evidence: z.custom<FileList | null>().optional(),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

interface MockSubmittedComplaint {
  id: string;
  employeeId: string; // ID of the employee who submitted
  employeeName: string; 
  zanId?: string; 
  department?: string;
  cadre?: string;
  complaintType: string;
  subject: string;
  details: string; // formerly complaintText
  submissionDate: string;
  status: "Submitted" | "Under Review" | "Awaiting More Information" | "Resolved - Pending Employee Confirmation" | "Rejected - Pending Employee Confirmation" | "Closed - Satisfied";
  attachments?: string[]; // Names of files
  officerComments?: string;
  internalNotes?: string; 
  assignedOfficerRole?: typeof ROLES.DO | typeof ROLES.HHRMD; // Which role is handling it
}

const initialMockComplaints: MockSubmittedComplaint[] = [
  {
    id: 'COMP001',
    employeeId: 'emp3', // Fatma Said Omar
    employeeName: 'Fatma Said Omar',
    zanId: '334589123',
    department: 'Finance',
    cadre: 'Accountant',
    complaintType: 'Unfair Treatment',
    subject: 'Overlooked for Training Opportunity',
    details: 'Employee states that they were unfairly overlooked for a training opportunity despite meeting all criteria and having relevant experience. This has happened multiple times.',
    submissionDate: '2024-07-20',
    status: 'Submitted',
    attachments: ['Evidence_Screenshot.png', 'Criteria_Doc.pdf'],
    assignedOfficerRole: ROLES.DO,
  },
  {
    id: 'COMP002',
    employeeId: 'emp1', // Ali Juma Ali
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
  },
  {
    id: 'COMP003',
    employeeId: 'emp7', // Hamid Mohamed
    employeeName: 'Hamid Mohamed',
    zanId: '778901234', // Assuming Hamid has a ZanID
    department: 'Transport',
    cadre: 'Senior Driver',
    complaintType: 'Salary Issue',
    subject: 'Incorrect Overtime Payment',
    details: 'My overtime for the past two months has been calculated incorrectly. I have attached my timesheets and pay slips for review.',
    submissionDate: '2024-07-25',
    status: 'Resolved - Pending Employee Confirmation',
    attachments: ['Timesheet_June.pdf', 'Payslip_June.pdf', 'Timesheet_July.pdf', 'Payslip_July.pdf'],
    officerComments: "We reviewed your timesheets and found an error in the overtime calculation due to a system glitch. This has been corrected, and the outstanding amount will be included in your next paycheck. We apologize for the inconvenience.",
    assignedOfficerRole: ROLES.HHRMD,
  },
   {
    id: 'COMP004',
    employeeId: 'emp2', // Safia Juma Ali
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
  const [officerInternalNote, setOfficerInternalNote] = useState(''); // For future edit
  const [actionType, setActionType] = useState<"resolve" | "reject" | "request_info" | null>(null);


  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      complaintType: "",
      subject: "",
      complaintText: "",
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
      submissionDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      status: "Submitted",
      attachments: data.evidence ? Array.from(data.evidence).map(file => file.name) : [],
      assignedOfficerRole: ROLES.DO, // Default assignment, can be changed by workflow
    };

    setComplaints(prev => [newComplaint, ...prev]);
    toast({ title: "Complaint Submitted", description: "Your complaint has been successfully submitted. It will be reviewed by the relevant department." });
    form.reset();
    setRewrittenComplaint(null);
  };

  const openActionModal = (complaint: MockSubmittedComplaint, type: "resolve" | "reject" | "request_info") => {
    setSelectedComplaint(complaint);
    setActionType(type);
    setOfficerActionComment(complaint.officerComments || ''); // Pre-fill if editing existing comments
    setOfficerInternalNote(complaint.internalNotes || ''); // Pre-fill internal notes
    setIsActionModalOpen(true);
  };

  const handleOfficerSubmitAction = () => {
    if (!selectedComplaint || !actionType || !officerActionComment.trim()) {
      toast({title: "Action Error", description: "Officer comments are required to proceed.", variant: "destructive"});
      return;
    }

    let newStatus: MockSubmittedComplaint['status'] = selectedComplaint.status;
    let toastMessage = "";

    if (actionType === 'resolve') {
      newStatus = "Resolved - Pending Employee Confirmation";
      toastMessage = `Complaint ${selectedComplaint.id} marked as Resolved.`;
    } else if (actionType === 'reject') {
      newStatus = "Rejected - Pending Employee Confirmation";
      toastMessage = `Complaint ${selectedComplaint.id} marked as Rejected.`;
    } else if (actionType === 'request_info') {
      newStatus = "Awaiting More Information";
      toastMessage = `More information requested for complaint ${selectedComplaint.id}.`;
    }
    
    setComplaints(prevComplaints =>
      prevComplaints.map(c =>
        c.id === selectedComplaint.id
          ? { ...c, status: newStatus, officerComments: officerActionComment, internalNotes: officerInternalNote, assignedOfficerRole: role as typeof ROLES.DO | typeof ROLES.HHRMD }
          : c
      )
    );
    
    toast({ title: "Action Taken", description: toastMessage });
    setIsActionModalOpen(false);
    setSelectedComplaint(null);
    setOfficerActionComment('');
    setOfficerInternalNote('');
    setActionType(null);
  };

  const handleEmployeeConfirmOutcome = (complaintId: string) => {
    setComplaints(prevComplaints =>
      prevComplaints.map(c =>
        c.id === complaintId ? { ...c, status: "Closed - Satisfied" } : c
      )
    );
    toast({title: "Complaint Closed", description: "Thank you for your feedback. The complaint has been closed."});
  };
  
  // Officer's view of complaints needing action
  const complaintsForOfficerReview = complaints.filter(c => 
    (role === ROLES.DO && c.assignedOfficerRole === ROLES.DO && (c.status === "Submitted" || c.status === "Under Review")) ||
    (role === ROLES.HHRMD && c.assignedOfficerRole === ROLES.HHRMD && (c.status === "Submitted" || c.status === "Under Review"))
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
                       <FormDescription>
                        You can use the AI tool below to help refine your description for clarity and compliance.
                      </FormDescription>
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
                            {complaint.officerComments && (
                                <Card className="mt-2 bg-secondary/30">
                                    <CardHeader className="pb-1 pt-2">
                                        <CardTitle className="text-sm font-medium">Officer's Feedback / Reason:</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-2">
                                        <p className="text-sm text-muted-foreground">{complaint.officerComments}</p>
                                    </CardContent>
                                </Card>
                            )}
                            {(complaint.status === "Resolved - Pending Employee Confirmation" || complaint.status === "Rejected - Pending Employee Confirmation") && (
                                <div className="mt-3 pt-3 border-t">
                                    <Button size="sm" onClick={() => handleEmployeeConfirmOutcome(complaint.id)} className="bg-green-600 hover:bg-green-700 text-white">
                                        <CheckCircle className="mr-2 h-4 w-4"/>
                                        Confirm Outcome and Close Complaint
                                    </Button>
                                </div>
                            )}
                             {complaint.status === "Awaiting More Information" && (
                                <div className="mt-3 pt-3 border-t">
                                    <p className="text-sm text-amber-700 font-medium">The reviewing officer has requested more information. Please review their comments and contact HR/DO to provide the necessary details.</p>
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
            {complaintsForOfficerReview.length > 0 ? (
              complaintsForOfficerReview.map((complaint) => (
                <div key={complaint.id} className="mb-4 border p-4 rounded-md space-y-2 shadow-sm bg-background hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-base">{complaint.subject} (Type: {complaint.complaintType})</h3>
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        complaint.status === "Submitted" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                    }`}>{complaint.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    From: {complaint.employeeName} {complaint.zanId ? `(ZanID: ${complaint.zanId})` : ''}
                  </p>
                  <p className="text-sm text-muted-foreground">Submitted: {format(parseISO(complaint.submissionDate), 'PPP')}</p>
                  <p className="text-sm mt-1"><strong>Details Preview:</strong> {complaint.details.substring(0, 150)}{complaint.details.length > 150 ? "..." : ""}</p>
                  
                  <div className="mt-3 pt-3 border-t flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedComplaint(complaint); setIsDetailsModalOpen(true); }}>
                        <Eye className="mr-2 h-4 w-4"/>View Full Details
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => openActionModal(complaint, "resolve")}>
                        <CheckCircle className="mr-2 h-4 w-4"/>Resolve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openActionModal(complaint, "reject")}>
                        <XCircle className="mr-2 h-4 w-4"/>Reject
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openActionModal(complaint, "request_info")}>
                        <Info className="mr-2 h-4 w-4"/>Request More Info
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No complaints currently assigned or pending your review.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* View Details Modal (for Officer) */}
      {selectedComplaint && isDetailsModalOpen && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Complaint Details: {selectedComplaint.id}</DialogTitle>
              <DialogDescription>
                From: <strong>{selectedComplaint.employeeName}</strong> ({selectedComplaint.zanId || 'N/A'}) | Type: {selectedComplaint.complaintType}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm max-h-[60vh] overflow-y-auto">
              <div><strong className="text-muted-foreground">Subject:</strong> <p className="mt-1">{selectedComplaint.subject}</p></div>
              <div><strong className="text-muted-foreground">Full Description:</strong> <p className="mt-1 whitespace-pre-wrap">{selectedComplaint.details}</p></div>
              <div><strong className="text-muted-foreground">Submitted On:</strong> {format(parseISO(selectedComplaint.submissionDate), 'PPP p')}</div>
              <div><strong className="text-muted-foreground">Status:</strong> <span className="text-primary">{selectedComplaint.status}</span></div>
              
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

       {/* Officer Action Modal */}
       {selectedComplaint && isActionModalOpen && actionType && (
        <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {actionType === 'resolve' && "Resolve Complaint"}
                        {actionType === 'reject' && "Reject Complaint"}
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
                        <Label htmlFor="officerActionComment">
                            {actionType === 'request_info' ? "Information/Clarification Needed from Employee:" : "Officer Comments / Reason for Action:"}
                        </Label>
                        <Textarea
                            id="officerActionComment"
                            placeholder="Enter your comments here..."
                            value={officerActionComment}
                            onChange={(e) => setOfficerActionComment(e.target.value)}
                            rows={5}
                            className="mt-1"
                        />
                    </div>
                     <div>
                        <Label htmlFor="officerInternalNote">Internal Notes (Optional, for record keeping)</Label>
                        <Textarea
                            id="officerInternalNote"
                            placeholder="Add any internal notes here..."
                            value={officerInternalNote}
                            onChange={(e) => setOfficerInternalNote(e.target.value)}
                            rows={3}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="officerAttachment">Attach Official Response Document (Optional, PDF only)</Label>
                        <Input id="officerAttachment" type="file" accept=".pdf" className="mt-1"/>
                        <FormDescription className="text-xs mt-1">
                            This is a placeholder. File upload logic is not fully implemented in this mock.
                        </FormDescription>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => { setIsActionModalOpen(false); setSelectedComplaint(null); setActionType(null); }}>Cancel</Button>
                    <Button 
                        onClick={handleOfficerSubmitAction} 
                        disabled={!officerActionComment.trim()}
                        className={
                            actionType === 'resolve' ? "bg-green-600 hover:bg-green-700 text-white" :
                            actionType === 'reject' ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" :
                            "" // Default for request_info
                        }
                    >
                        {actionType === 'resolve' && <><CheckCircle className="mr-2 h-4 w-4"/>Confirm Resolution</>}
                        {actionType === 'reject' && <><XCircle className="mr-2 h-4 w-4"/>Confirm Rejection</>}
                        {actionType === 'request_info' && <><MessageSquarePlus className="mr-2 h-4 w-4"/>Send Request for Information</>}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
