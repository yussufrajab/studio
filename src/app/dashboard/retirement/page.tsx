'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function RetirementPage() {
  const { role } = useAuth();
  return (
    <div>
      <PageHeader title="Retirement" description="Manage employee retirement processes." />
       {role === ROLES.HRO && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Submit Retirement Request</CardTitle>
            <CardDescription>Initiate retirement process for an employee.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="employeeIdRetirement">Employee ID / ZanID</Label>
              <Input id="employeeIdRetirement" placeholder="Enter employee ID or ZanID" />
            </div>
            <div>
              <Label htmlFor="retirementType">Retirement Type</Label>
              <Select>
                <SelectTrigger id="retirementType">
                  <SelectValue placeholder="Select retirement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compulsory">Compulsory</SelectItem>
                  <SelectItem value="voluntary">Voluntary</SelectItem>
                  <SelectItem value="illness">Illness</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="retirementDate">Proposed Retirement Date</Label>
              <Input id="retirementDate" type="date" />
            </div>
            <div>
              <Label htmlFor="documentsRetirement">Upload Supporting Documents (Retirement Application, Medical Report if applicable)</Label>
              <Input id="documentsRetirement" type="file" multiple />
            </div>
            <Button>Submit Request</Button>
          </CardContent>
        </Card>
      )}
      {(role === ROLES.HHRMD_HRMO || role === ROLES.DO) && (
        <Card>
          <CardHeader>
            <CardTitle>Review Retirement Requests</CardTitle>
            <CardDescription>Approve or reject retirement requests.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">No retirement requests pending review.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
