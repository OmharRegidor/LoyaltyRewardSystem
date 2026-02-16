// apps/web/components/auth/AccessDenied.tsx

'use client';

import { useRouter } from 'next/navigation';

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-white" style={{ colorScheme: 'light' }}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-500">
          You do not have permission to view this page.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
