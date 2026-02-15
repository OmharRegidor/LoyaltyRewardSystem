'use client';

import Link from 'next/link';
import { FileQuestion, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/dashboard/layout';

export default function DashboardNotFound() {
  return (
    <DashboardLayout>
      <div className="flex-1 flex items-center justify-center py-32">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>

          <p className="text-muted-foreground mb-8">
            The dashboard page you&apos;re looking for doesn&apos;t exist or may
            have been moved.
          </p>

          <Button asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
