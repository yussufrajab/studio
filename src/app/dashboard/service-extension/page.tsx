'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function ServiceExtensionPage() {
  const { role } = useAuth();
  return (
    <div>
      <PageHeader title="Service Extension" description="Manage employee service extensions." />
      {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Service Extension Request</CardTitle>
            <CardDescription>Request extension of service for an employee.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeIdServiceExt">Employee ID / ZanID</Label>
              <Input id="employeeIdServiceExt" placeholder="Enter employee ID or ZanID" />
            </div>
            <div>
              <Label htmlFor="currentRetirementDate">Current Retirement Date</Label>
              <Input id="currentRetirementDate" type="date" />
            </div>
            <div>
              <Label htmlFor="extensionPeriod">Requested Extension Period (e.g., 1 year, 6 months)</Label>
              <Input id="extensionPeriod" placeholder="Specify duration of extension" />
            </div>
             <div>
              <Label htmlFor="justificationServiceExt">Justification for Extension</Label>
              <Textarea id="justificationServiceExt" placeholder="Provide strong reasons for the service extension" />
            </div>
            <div>
              <Label htmlFor="documentsServiceExt">Upload Supporting Documents (Performance record, HOD recommendation)</Label>
              <Input id="documentsServiceExt" type="file" multiple />
            </div>
            <Button>Submit Request</Button>
          </CardContent>
        </Card>
      )}
      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card>
          <CardHeader>
            <CardTitle>Review Service Extension Requests</CardTitle>
            <CardDescription>Approve or reject service extension requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No service extension requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
