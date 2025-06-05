'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function TerminationPage() {
  const { role } = useAuth();
  return (
    <div>
      <PageHeader title="Termination" description="Process employee terminations." />
      {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Termination Request</CardTitle>
            <CardDescription>Initiate termination due to misconduct or other reasons.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeIdTermination">Employee ID / ZanID</Label>
              <Input id="employeeIdTermination" placeholder="Enter employee ID or ZanID" />
            </div>
            <div>
              <Label htmlFor="reasonTermination">Reason for Termination &amp; Summary of Misconduct</Label>
              <Textarea id="reasonTermination" placeholder="Clearly state the grounds for termination and summarize evidence" />
            </div>
            <div>
              <Label htmlFor="terminationDate">Proposed Date of Termination</Label>
              <Input id="terminationDate" type="date" />
            </div>
            <div>
              <Label htmlFor="documentsTermination">Upload Misconduct Evidence &amp; Investigation Reports</Label>
              <Input id="documentsTermination" type="file" multiple />
            </div>
            <Button>Submit Termination Request</Button>
          </CardContent>
        </Card>
      )}
      {(role === ROLES.DO || role === ROLES.HHRMD_HRMO ) && ( // DO is primary, HHRMD might review
        <Card>
          <CardHeader>
            <CardTitle>Review Termination Requests</CardTitle>
            <CardDescription>Approve or reject termination requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No termination requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
