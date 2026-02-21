// apps/web/app/join/[code]/join-not-found.tsx

import Link from 'next/link';
import { FileQuestion, Home } from 'lucide-react';

export function JoinNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#7F0404] py-6 px-4 text-center">
        <h1 className="text-2xl font-bold text-white">NoxaLoyalty</h1>
      </div>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 mb-6">
            <FileQuestion className="h-10 w-10 text-gray-500" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Join Link
          </h2>

          <p className="text-gray-500 mb-8">
            This loyalty program link is invalid or has expired. Please check
            with the business for a valid link.
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Back to Homepage
          </Link>
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-gray-400">
          Powered by <span className="font-semibold text-gray-500">NoxaLoyalty</span>
        </p>
      </footer>
    </div>
  );
}
