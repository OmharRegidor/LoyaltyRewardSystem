import Link from 'next/link';
import Image from 'next/image';
import { FileQuestion, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 py-1">
                <Image
                  src="/logoloyalty.png"
                  alt="Noxa Tech Loyalty"
                  width={200}
                  height={64}
                  className="h-10 sm:h-14 lg:h-16 w-auto object-contain"
                  priority
                />
                <div className="flex flex-col justify-center border-l border-white/30 pl-2 sm:pl-3">
                  <span className="text-md font-bold leading-tight text-white">
                    NoxaLoyalty
                  </span>
                </div>
              </div>
            </Link>

            <Link href="/login">
              <Button
                variant="ghost"
                className="font-bold text-sm px-4 text-white/90 hover:text-white hover:bg-white/10"
              >
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>

          <p className="text-muted-foreground mb-8">
            The page you&apos;re looking for doesn&apos;t exist or may have been
            moved.
          </p>

          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Homepage
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} NoxaLoyalty. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
