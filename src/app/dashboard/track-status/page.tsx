
'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { ROLES } from '@/lib/constants';

export default function TrackStatusPage() {
  const { role } = useAuth();

  return (
    <div>
      <PageHeader title="Track Request Status" description="Monitor the status of your submitted requests to the Civil Service Commission." />
      {role === ROLES.HRO && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Request Tracking</CardTitle>
            <CardDescription>
              This section will display the status of all requests you have submitted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Feature coming soon. You will be able to see a list of your submitted requests (Confirmation, LWOP, Promotion, etc.) and their current processing status here.</p>
            {/* 
            Future Table Placeholder:
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-border shadow-sm rounded-lg">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Request ID</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Employee Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Request Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Submission Date</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-background divide-y divide-border">
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">REQ-2024-001</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Ali Juma Ali</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Confirmation</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">2024-07-15</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600">Pending HHRMD Review</td>
                  </tr>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">REQ-2024-002</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Safia Juma Ali</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">Promotion</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">2024-07-10</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">Approved by DO</td>
                  </tr>
                </tbody>
              </table>
            </div>
            */}
          </CardContent>
        </Card>
      )}
      {role !== ROLES.HRO && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This module is only available for HRO personnel.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
