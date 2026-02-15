// apps/web/app/business/[slug]/not-found.tsx

import Link from 'next/link';
import { Building2, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BusinessNotFound() {
  return (
    <div className="flex-1 flex items-center justify-center py-32 px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
          <Building2 className="h-10 w-10 text-muted-foreground" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Business Not Found</h1>

        <p className="text-muted-foreground mb-8">
          The business page you&apos;re looking for doesn&apos;t exist or may no
          longer be active.
        </p>

        <Button asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Go to Homepage
          </Link>
        </Button>
      </div>
    </div>
  );
}
