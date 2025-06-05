'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function LwopPage() {
  const { role } = useAuth();
  return (
    <div>
      <PageHeader title="Leave Without Pay (LWOP)" description="Manage LWOP requests." />
      {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit LWOP Request</CardTitle>
            <CardDescription>Fill in the details for an LWOP request.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeId">Employee ID / ZanID</Label>
              <Input id="employeeId" placeholder="Enter employee ID or ZanID" />
            </div>
            <div>
              <Label htmlFor="duration">Duration (e.g., 3 months, 2024-01-01 to 2024-03-31)</Label>
              <Input id="duration" placeholder="Specify duration and dates" />
            </div>
            <div>
              <Label htmlFor="reason">Reason for LWOP</Label>
              <Textarea id="reason" placeholder="State the reason for the leave request" />
            </div>
            <div>
              <Label htmlFor="documentsLwop">Upload Supporting Documents</Label>
              <Input id="documentsLwop" type="file" multiple />
            </div>
            <Button>Submit Request</Button>
          </CardContent>
        </Card>
      )}

       {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card>
          <CardHeader>
            <CardTitle>Review LWOP Requests</CardTitle>
            <CardDescription>Approve or reject pending LWOP requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No LWOP requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
