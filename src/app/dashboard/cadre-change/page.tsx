'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function CadreChangePage() {
  const { role } = useAuth();
  return (
    <div>
      <PageHeader title="Change of Cadre" description="Process employee cadre changes." />
      {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Cadre Change Request</CardTitle>
            <CardDescription>Details for changing an employee's cadre.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeIdCadre">Employee ID / ZanID</Label>
              <Input id="employeeIdCadre" placeholder="Enter employee ID or ZanID" />
            </div>
             <div>
              <Label htmlFor="currentCadreChange">Current Cadre</Label>
              <Input id="currentCadreChange" placeholder="e.g., Administrative Officer" />
            </div>
            <div>
              <Label htmlFor="newCadre">New Cadre</Label>
              <Input id="newCadre" placeholder="e.g., Human Resource Officer" />
            </div>
            <div>
              <Label htmlFor="reasonCadreChange">Reason for Cadre Change &amp; Qualifications</Label>
              <Textarea id="reasonCadreChange" placeholder="Explain the reason and list relevant qualifications" />
            </div>
            <div>
              <Label htmlFor="documentsCadre">Upload Supporting Documents (Certificates, Transcripts)</Label>
              <Input id="documentsCadre" type="file" multiple />
            </div>
            <Button>Submit Request</Button>
          </CardContent>
        </Card>
      )}
      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card>
          <CardHeader>
            <CardTitle>Review Cadre Change Requests</CardTitle>
            <CardDescription>Approve or reject cadre change requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No cadre change requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
