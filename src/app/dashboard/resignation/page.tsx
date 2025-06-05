'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function ResignationPage() {
  const { role } = useAuth();
  return (
    <div>
      <PageHeader title="Resignation" description="Process employee resignations." />
       {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Resignation Request</CardTitle>
            <CardDescription>Process an employee's resignation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeIdResignation">Employee ID / ZanID</Label>
              <Input id="employeeIdResignation" placeholder="Enter employee ID or ZanID" />
            </div>
             <div>
              <Label htmlFor="resignationDate">Effective Date of Resignation</Label>
              <Input id="resignationDate" type="date" />
            </div>
            <div>
              <Label htmlFor="reasonResignation">Reason for Resignation (if provided)</Label>
              <Textarea id="reasonResignation" placeholder="Optional: Enter reason stated by employee" />
            </div>
            <div>
              <Label htmlFor="documentsResignation">Upload Resignation Letter &amp; Clearance Forms</Label>
              <Input id="documentsResignation" type="file" multiple />
            </div>
            <Button>Submit Request</Button>
          </CardContent>
        </Card>
      )}
      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card>
          <CardHeader>
            <CardTitle>Review Resignation Requests</CardTitle>
            <CardDescription>Acknowledge and process resignations.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No resignation requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
