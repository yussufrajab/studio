'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function PromotionPage() {
  const { role } = useAuth();
  return (
    <div>
      <PageHeader title="Promotion" description="Manage employee promotions." />
      {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Promotion Request</CardTitle>
            <CardDescription>Provide details for employee promotion.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeIdPromo">Employee ID / ZanID</Label>
              <Input id="employeeIdPromo" placeholder="Enter employee ID or ZanID" />
            </div>
            <div>
              <Label htmlFor="currentCadre">Current Cadre/Position</Label>
              <Input id="currentCadre" placeholder="e.g., Senior Officer" />
            </div>
            <div>
              <Label htmlFor="proposedCadre">Proposed New Cadre/Position</Label>
              <Input id="proposedCadre" placeholder="e.g., Principal Officer" />
            </div>
            <div>
              <Label htmlFor="performanceRecords">Performance Records Summary</Label>
              <Textarea id="performanceRecords" placeholder="Summarize key performance achievements and qualifications" />
            </div>
            <div>
              <Label htmlFor="documentsPromo">Upload Supporting Documents (CV, Certificates, Performance Appraisals)</Label>
              <Input id="documentsPromo" type="file" multiple />
            </div>
            <Button>Submit Promotion Request</Button>
          </CardContent>
        </Card>
      )}

      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card>
          <CardHeader>
            <CardTitle>Review Promotion Requests</CardTitle>
            <CardDescription>Approve or reject pending promotion requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No promotion requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
