'use client';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ReportsPage() {
  return (
    <div>
      <PageHeader title="Reports &amp; Analytics" description="Generate and view system reports." />
      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">The reports and analytics module is currently under development. Please check back later for updates.</p>
        </CardContent>
      </Card>
    </div>
  );
}
