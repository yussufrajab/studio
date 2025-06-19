
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import React, { useState, useEffect } from 'react';
import { Loader2, Search, Eye, CalendarDays, Filter } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { format, parseISO, isValid, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

interface RequestAction {
  role: string;
  actorName?: string;
  action: string;
  date: string;
  comments?: string;
}

interface MockTrackedRequest {
  id: string;
  employeeName: string;
  zanId: string;
  requestType: string;
  submissionDate: string; // Date HRO submitted
  status: string; // Current overall status: Pending HHRMD, Pending DO, Approved, Rejected, etc.
  lastUpdatedDate: string; // Date of the last action
  currentStage: string; // More specific stage: e.g., "Pending Initial Review (HHRMD)", "Awaiting Commission Decision (DO Forwarded)", "Completed - Approved"
  actions?: RequestAction[];
}

const ALL_MOCK_REQUESTS: MockTrackedRequest[] = [
  {
    id: 'CONF001', employeeName: 'Ali Juma Ali', zanId: "221458232", requestType: 'Confirmation',
    submissionDate: '2024-07-28', status: 'Pending HHRMD Review', lastUpdatedDate: '2024-07-28', currentStage: 'Awaiting HHRMD Verification',
    actions: [{ role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-07-28', comments: 'Initial submission for confirmation.' }]
  },
  {
    id: 'LWOP001', employeeName: 'Fatma Said Omar', zanId: "334589123", requestType: 'LWOP',
    submissionDate: '2024-07-25', status: 'Pending HHRMD Review', lastUpdatedDate: '2024-07-25', currentStage: 'Awaiting HHRMD Review',
    actions: [{ role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-07-25', comments: 'LWOP for further studies.' }]
  },
  {
    id: 'PROM002', employeeName: 'Juma Omar Ali', zanId: "667890456", requestType: 'Promotion',
    submissionDate: '2024-07-26', status: 'Pending HRMO Review', lastUpdatedDate: '2024-07-26', currentStage: 'Awaiting HRMO Verification',
    actions: [{ role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-07-26', comments: 'Promotion based on Education Advancement.' }]
  },
  {
    id: 'CADRE001', employeeName: 'Ali Juma Ali', zanId: "221458232", requestType: 'Change of Cadre',
    submissionDate: '2024-07-29', status: 'Pending HHRMD Review', lastUpdatedDate: '2024-07-29', currentStage: 'Awaiting HHRMD Review',
    actions: [{ role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-07-29', comments: 'Request for cadre change to Senior Officer.' }]
  },
  {
    id: 'RETIRE002', employeeName: 'Juma Omar Ali', zanId: "667890456", requestType: 'Retirement',
    submissionDate: '2024-07-28', status: 'Approved by Commission', lastUpdatedDate: '2024-08-05', currentStage: 'Completed - Approved',
    actions: [
      { role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-07-28', comments: 'Voluntary retirement application.' },
      { role: ROLES.HRMO, actorName: 'F. Iddi', action: 'Verified & Forwarded to Commission', date: '2024-07-30', comments: 'All documents in order.' },
      { role: ROLES.HRMO, actorName: 'F. Iddi', action: 'Approved by Commission', date: '2024-08-05', comments: 'Commission approved on 05/08/2024.' }
    ]
  },
  {
    id: 'SEXT001', employeeName: 'Hamid Khalfan Abdalla', zanId: "778901234", requestType: 'Service Extension',
    submissionDate: '2024-07-20', status: 'Rejected by Commission', lastUpdatedDate: '2024-08-02', currentStage: 'Completed - Rejected',
    actions: [
      { role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-07-20', comments: 'Service extension for critical project.' },
      { role: ROLES.HHRMD, actorName: 'S. Khamis', action: 'Verified & Forwarded to Commission', date: '2024-07-25', comments: 'Justification seems valid.' },
      { role: ROLES.HHRMD, actorName: 'S. Khamis', action: 'Rejected by Commission', date: '2024-08-02', comments: 'Commission rejected; policy states no extension for this cadre.' }
    ]
  },
  {
    id: 'TERM001', employeeName: 'Ali Juma Ali', zanId: "221458232", requestType: 'Termination',
    submissionDate: '2024-07-25', status: 'Pending DO Review', lastUpdatedDate: '2024-07-25', currentStage: 'Awaiting DO Initial Review',
    actions: [{ role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-07-25', comments: 'Termination due to unauthorized absence.' }]
  },
  {
    id: 'COMP001', employeeName: 'Fatma Said Omar', zanId: "334589123", requestType: 'Complaints',
    submissionDate: '2024-07-20', status: 'Resolved - Pending Employee Confirmation', lastUpdatedDate: '2024-07-28', currentStage: 'DO Resolved, Awaiting Confirmation',
    actions: [
      { role: ROLES.EMPLOYEE, actorName: 'Fatma Said Omar', action: 'Submitted', date: '2024-07-20', comments: 'Complaint about unfair treatment.' },
      { role: ROLES.DO, actorName: 'M. Ussi', action: 'Reviewed & Resolved', date: '2024-07-28', comments: 'Issue addressed with department head.' }
    ]
  },
   {
    id: 'CONF002', employeeName: 'Safia Juma Ali', zanId: "125468957", requestType: 'Confirmation',
    submissionDate: '2024-06-15', status: 'Awaiting Commission Decision', lastUpdatedDate: '2024-06-20', currentStage: 'HRMO Forwarded to Commission',
    actions: [
      { role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-06-15' },
      { role: ROLES.HRMO, actorName: 'F. Iddi', action: 'Verified & Forwarded', date: '2024-06-20', comments: 'Ready for commission review.' }
    ]
  },
  {
    id: 'PROM001', employeeName: 'Zainab Ali Khamis', zanId: "556789345", requestType: 'Promotion',
    submissionDate: '2024-05-10', status: 'Rejected by HHRMD - Awaiting HRO Correction', lastUpdatedDate: '2024-05-15', currentStage: 'HHRMD Rejected, HRO to Correct',
    actions: [
      { role: ROLES.HRO, actorName: 'K. Mnyonge', action: 'Submitted', date: '2024-05-10' },
      { role: ROLES.HHRMD, actorName: 'S. Khamis', action: 'Rejected', date: '2024-05-15', comments: 'Incomplete performance appraisals submitted.' }
    ]
  }
];


export default function TrackStatusPage() {
  const { role } = useAuth();
  const [zanIdInput, setZanIdInput] = useState(''); // For non-CSCS search
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [foundRequests, setFoundRequests] = useState<MockTrackedRequest[]>([]);

  // CSCS specific state
  const [allRequestsForCSCS, setAllRequestsForCSCS] = useState<MockTrackedRequest[]>([]);
  const [filteredRequestsCSCS, setFilteredRequestsCSCS] = useState<MockTrackedRequest[]>([]);
  const [fromDateCSCS, setFromDateCSCS] = useState('');
  const [toDateCSCS, setToDateCSCS] = useState('');
  const [zanIdCSCSFilter, setZanIdCSCSFilter] = useState(''); // For CSCS ZanID filter input
  const [selectedRequestDetails, setSelectedRequestDetails] = useState<MockTrackedRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const canAccessModule = role === ROLES.HRO || role === ROLES.HHRMD || role === ROLES.HRMO || role === ROLES.DO || role === ROLES.CSCS || role === ROLES.HRRP;

  useEffect(() => {
    if (role === ROLES.CSCS) {
      const sortedRequests = [...ALL_MOCK_REQUESTS].sort((a, b) => new Date(b.lastUpdatedDate).getTime() - new Date(a.lastUpdatedDate).getTime());
      setAllRequestsForCSCS(sortedRequests);
      setFilteredRequestsCSCS(sortedRequests.slice(0, 100)); 
      setSearchAttempted(true); 
    }
  }, [role]);

  const handleSearchRequests = () => {
    if (!zanIdInput.trim()) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID to search.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setSearchAttempted(false);
    setFoundRequests([]);

    setTimeout(() => {
      const requests = ALL_MOCK_REQUESTS.filter(req => req.zanId === zanIdInput.trim());
      setFoundRequests(requests);
      setSearchAttempted(true);
      setIsSearching(false);
      if (requests.length === 0) {
        toast({ title: "No Requests Found", description: `No requests found for ZanID: ${zanIdInput}.` });
      } else {
        toast({ title: "Requests Found", description: `Displaying requests for ZanID: ${zanIdInput}.` });
      }
    }, 1000);
  };

  const handleFilterCSCSRequests = () => {
    setIsSearching(true);
    let filtered = [...allRequestsForCSCS];

    if (fromDateCSCS && toDateCSCS) {
      const startDate = startOfDay(parseISO(fromDateCSCS));
      const endDate = endOfDay(parseISO(toDateCSCS));
      if (isValid(startDate) && isValid(endDate) && !isWithinInterval(endDate, { start: new Date(0), end: startDate })) {
         filtered = filtered.filter(req => {
          const submissionDate = parseISO(req.submissionDate);
          return isValid(submissionDate) && isWithinInterval(submissionDate, { start: startDate, end: endDate });
        });
      } else {
         toast({ title: "Invalid Date Range", description: "End date must be after start date, if both are provided.", variant: "destructive"});
         setIsSearching(false);
         return;
      }
    }
    
    if (zanIdCSCSFilter.trim()) {
      filtered = filtered.filter(req => req.zanId === zanIdCSCSFilter.trim());
    }

    setFilteredRequestsCSCS(filtered.slice(0,100));
    setIsSearching(false);
    if (filtered.length === 0) {
      toast({ title: "No Results", description: "No requests match your filter criteria."});
    } else {
      toast({ title: "Filter Applied", description: `Displaying ${filtered.length > 100 ? 'first 100 matching ' : ''}requests.`});
    }
  };
  
  const handleViewDetailsCSCS = (request: MockTrackedRequest) => {
    setSelectedRequestDetails(request);
    setIsDetailsModalOpen(true);
  };
  
  const displayRequests = role === ROLES.CSCS ? filteredRequestsCSCS : foundRequests;


  return (
    <div>
      <PageHeader title="Track Request Status" description="Monitor the status of requests submitted to the Civil Service Commission." />
      {!canAccessModule ? (
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">You do not have permission to access this module.</p></CardContent>
        </Card>
      ) : (
        <>
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle>{role === ROLES.CSCS ? "All Submitted Requests" : "Search Employee Requests"}</CardTitle>
              <CardDescription>
                {role === ROLES.CSCS
                  ? "View and filter all submitted requests. Click on a request to see details."
                  : "Enter an employee's ZanID to view the status of their submitted requests."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {role === ROLES.CSCS ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1 md:col-span-1">
                    <Label htmlFor="fromDateCSCS" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary"/>From Date</Label>
                    <Input id="fromDateCSCS" type="date" value={fromDateCSCS} onChange={(e) => setFromDateCSCS(e.target.value)} disabled={isSearching}/>
                  </div>
                  <div className="space-y-1 md:col-span-1">
                    <Label htmlFor="toDateCSCS" className="flex items-center"><CalendarDays className="mr-2 h-4 w-4 text-primary"/>To Date</Label>
                    <Input id="toDateCSCS" type="date" value={toDateCSCS} onChange={(e) => setToDateCSCS(e.target.value)} disabled={isSearching}/>
                  </div>
                   <div className="space-y-1 md:col-span-1">
                    <Label htmlFor="zanIdTrackCSCS">Optional: ZanID</Label>
                    <Input id="zanIdTrackCSCS" placeholder="Filter by ZanID" value={zanIdCSCSFilter} onChange={(e) => setZanIdCSCSFilter(e.target.value)} disabled={isSearching}/>
                  </div>
                  <Button onClick={handleFilterCSCSRequests} disabled={isSearching} className="md:self-end">
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Filter className="mr-2 h-4 w-4" />}
                    Filter Requests
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-2 space-y-2 sm:space-y-0">
                  <div className="flex-grow space-y-1">
                    <Label htmlFor="zanIdTrack">Employee ZanID</Label>
                    <Input id="zanIdTrack" placeholder="Enter ZanID" value={zanIdInput} onChange={(e) => setZanIdInput(e.target.value)} disabled={isSearching}/>
                  </div>
                  <Button onClick={handleSearchRequests} disabled={isSearching || !zanIdInput.trim()}>
                    {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                    Search Requests
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isSearching && (
            <div className="flex items-center justify-center mt-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading requests...</p>
            </div>
          )}

          {!isSearching && searchAttempted && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>
                  {role === ROLES.CSCS ? (zanIdCSCSFilter ? `Requests for ZanID: ${zanIdCSCSFilter}` : "Request Overview") : `Request Status for ZanID: ${zanIdInput}`}
                </CardTitle>
                 <CardDescription>
                  {role === ROLES.CSCS && !zanIdCSCSFilter && `Displaying latest ${displayRequests.length} requests. Use filters to refine.`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {displayRequests.length > 0 ? (
                  <Table>
                    <TableCaption>
                      {role === ROLES.CSCS ? "Overview of submitted requests." : `A list of recent requests for ZanID: ${zanIdInput}.`}
                    </TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Request ID</TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>ZanID</TableHead>
                        <TableHead>Request Type</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Current Stage</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                        {role === ROLES.CSCS && <TableHead className="text-right">Actions</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayRequests.map((request) => (
                        <TableRow key={request.id} onClick={() => role === ROLES.CSCS && handleViewDetailsCSCS(request)} className={role === ROLES.CSCS ? "cursor-pointer hover:bg-muted/50" : ""}>
                          <TableCell className="font-medium">{request.id}</TableCell>
                          <TableCell>{request.employeeName}</TableCell>
                          <TableCell>{request.zanId}</TableCell>
                          <TableCell>{request.requestType}</TableCell>
                          <TableCell>{format(parseISO(request.submissionDate), 'PPP')}</TableCell>
                          <TableCell>{format(parseISO(request.lastUpdatedDate), 'PPP')}</TableCell>
                          <TableCell>{request.currentStage}</TableCell>
                          <TableCell className="text-right">{request.status}</TableCell>
                          {role === ROLES.CSCS && (
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetailsCSCS(request); }}>
                                <Eye className="mr-1 h-3 w-3" /> Details
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    {role === ROLES.CSCS ? "No requests match the current filter criteria." : `No requests found for ZanID: ${zanIdInput}.`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {role !== ROLES.CSCS && !isSearching && !searchAttempted && (
            <Card className="shadow-lg">
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center">Please enter an employee's ZanID above and click "Search Requests" to view their request history.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {selectedRequestDetails && isDetailsModalOpen && (
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Details: {selectedRequestDetails.id}</DialogTitle>
              <DialogDescription>
                <strong>Employee:</strong> {selectedRequestDetails.employeeName} (ZanID: {selectedRequestDetails.zanId}) <br />
                <strong>Request Type:</strong> {selectedRequestDetails.requestType}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><Label className="font-semibold">Submission Date:</Label> <p>{format(parseISO(selectedRequestDetails.submissionDate), 'PPP p')}</p></div>
                <div><Label className="font-semibold">Last Updated:</Label> <p>{format(parseISO(selectedRequestDetails.lastUpdatedDate), 'PPP p')}</p></div>
                <div><Label className="font-semibold">Current Status:</Label> <p className="text-primary">{selectedRequestDetails.status}</p></div>
                <div><Label className="font-semibold">Current Stage:</Label> <p>{selectedRequestDetails.currentStage}</p></div>
              </div>
              
              <h4 className="font-semibold text-md mt-4 pt-3 border-t">Workflow History</h4>
              {selectedRequestDetails.actions && selectedRequestDetails.actions.length > 0 ? (
                <div className="space-y-3">
                  {selectedRequestDetails.actions.map((action, index) => (
                    <Card key={index} className="bg-secondary/30 p-3 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-primary-foreground bg-primary px-2 py-0.5 rounded-sm text-xs">{action.role}</span>
                        <span className="text-xs text-muted-foreground">{format(parseISO(action.date), 'PPP p')}</span>
                      </div>
                       {action.actorName && <p className="text-xs text-muted-foreground mb-1">By: {action.actorName}</p>}
                      <p className="font-medium">{action.action}</p>
                      {action.comments && <p className="text-xs text-muted-foreground mt-1"><em>Comments: {action.comments}</em></p>}
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No workflow history available for this request.</p>
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

    </div>
  );
}

