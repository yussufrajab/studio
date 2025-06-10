
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';
import React, { useState } from 'react';
import { Loader2, Search } from 'lucide-react';
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

interface MockRequest {
  id: string;
  employeeName: string; // Assuming we can get this, or use ZanID
  zanId: string;
  requestType: string;
  submissionDate: string;
  status: string;
}

const MOCK_DATA_STORE: { [key: string]: MockRequest[] } = {
  "221458232": [ // Ali Juma Ali
    { id: 'REQ-2024-001', employeeName: 'Ali Juma Ali', zanId: "221458232", requestType: 'Confirmation', submissionDate: '2024-07-15', status: 'Pending HHRMD Review' },
    { id: 'REQ-2024-005', employeeName: 'Ali Juma Ali', zanId: "221458232", requestType: 'LWOP', submissionDate: '2024-06-10', status: 'Approved by DO' },
  ],
  "125468957": [ // Safia Juma Ali
    { id: 'REQ-2024-002', employeeName: 'Safia Juma Ali', zanId: "125468957", requestType: 'Promotion', submissionDate: '2024-07-10', status: 'Approved by DO' },
  ],
  "emp_no_requests": [] // For testing no requests found
};


export default function TrackStatusPage() {
  const { role } = useAuth();
  const [zanId, setZanId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [foundRequests, setFoundRequests] = useState<MockRequest[]>([]);

  const canAccessModule = role === ROLES.HRO || role === ROLES.HHRMD || role === ROLES.HRMO;

  const handleSearchRequests = () => {
    if (!zanId.trim()) {
      toast({ title: "ZanID Required", description: "Please enter an employee's ZanID to search.", variant: "destructive" });
      return;
    }
    setIsSearching(true);
    setSearchAttempted(false); // Reset on new search
    setFoundRequests([]);

    // Simulate API call
    setTimeout(() => {
      const requests = MOCK_DATA_STORE[zanId.trim()];
      if (requests) {
        setFoundRequests(requests);
      } else {
        // Simulate finding employee but no requests, or employee not found by returning empty
        setFoundRequests([]); 
      }
      setSearchAttempted(true);
      setIsSearching(false);
      if (!requests || requests.length === 0) {
        toast({ title: "No Requests Found", description: `No requests found for ZanID: ${zanId}.`});
      } else {
        toast({ title: "Requests Found", description: `Displaying requests for ZanID: ${zanId}.`});
      }
    }, 1000);
  };

  return (
    <div>
      <PageHeader title="Track Request Status" description="Monitor the status of requests submitted to the Civil Service Commission." />
      {canAccessModule ? (
        <>
          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle>Search Employee Requests</CardTitle>
              <CardDescription>
                Enter an employee's ZanID to view the status of their submitted requests.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-2 space-y-2 sm:space-y-0">
                <div className="flex-grow space-y-1">
                  <Label htmlFor="zanIdTrack">Employee ZanID</Label>
                  <Input 
                    id="zanIdTrack" 
                    placeholder="Enter ZanID" 
                    value={zanId} 
                    onChange={(e) => setZanId(e.target.value)} 
                    disabled={isSearching}
                  />
                </div>
                <Button onClick={handleSearchRequests} disabled={isSearching || !zanId.trim()}>
                  {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                  Search Requests
                </Button>
              </div>
            </CardContent>
          </Card>

          {isSearching && (
            <div className="flex items-center justify-center mt-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Searching for requests...</p>
            </div>
          )}

          {!isSearching && searchAttempted && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Request Status for ZanID: {zanId}</CardTitle>
              </CardHeader>
              <CardContent>
                {foundRequests.length > 0 ? (
                  <Table>
                    <TableCaption>A list of recent requests for ZanID: {zanId}.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[150px]">Request ID</TableHead>
                        <TableHead>Employee Name</TableHead>
                        <TableHead>Request Type</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {foundRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.id}</TableCell>
                          <TableCell>{request.employeeName}</TableCell>
                          <TableCell>{request.requestType}</TableCell>
                          <TableCell>{request.submissionDate}</TableCell>
                          <TableCell className="text-right">{request.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No requests found for ZanID: {zanId}.</p>
                )}
              </CardContent>
            </Card>
          )}
          
          {!isSearching && !searchAttempted && (
            <Card className="shadow-lg">
                <CardContent className="pt-6">
                    <p className="text-muted-foreground text-center">Please enter an employee's ZanID above and click "Search Requests" to view their request history.</p>
                </CardContent>
            </Card>
          )}
        </>
      ) : (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have permission to access this module.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
