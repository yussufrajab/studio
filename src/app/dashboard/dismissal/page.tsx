'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function DismissalPage() {
  const { role } = useAuth();
  return (
    <div>
      <PageHeader title="Dismissal" description="Process employee dismissals for severe misconduct." />
       {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Dismissal Request</CardTitle>
            <CardDescription>Initiate dismissal due to severe misconduct.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeIdDismissal">Employee ID / ZanID</Label>
              <Input id="employeeIdDismissal" placeholder="Enter employee ID or ZanID" />
            </div>
            <div>
              <Label htmlFor="reasonDismissal">Reason for Dismissal &amp; Summary of Severe Misconduct</Label>
              <Textarea id="reasonDismissal" placeholder="Clearly state the grounds for dismissal and summarize evidence" />
            </div>
             <div>
              <Label htmlFor="dismissalDate">Proposed Date of Dismissal</Label>
              <Input id="dismissalDate" type="date" />
            </div>
            <div>
              <Label htmlFor="documentsDismissal">Upload Evidence of Severe Misconduct &amp; Investigation Reports</Label>
              <Input id="documentsDismissal" type="file" multiple />
            </div>
            <Button>Submit Dismissal Request</Button>
          </CardContent>
        </Card>
      )}
      {(role === ROLES.DO || role === ROLES.HHRMD_HRMO) && ( // DO is primary, HHRMD might review
        <Card>
          <CardHeader>
            <CardTitle>Review Dismissal Requests</CardTitle>
            <CardDescription>Approve or reject dismissal requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No dismissal requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
