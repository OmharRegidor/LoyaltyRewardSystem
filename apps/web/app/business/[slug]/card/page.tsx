// apps/web/app/business/[slug]/card/page.tsx

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { User, Phone, Mail, CreditCard, Check } from 'lucide-react';
import {
  getBusinessBySlug,
  signUpForLoyaltyCard,
  type PublicCustomer,
} from '@/lib/services/public-business.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface CardSignupPageProps {
  params: Promise<{ slug: string }>;
}

interface SignupFormData {
  full_name: string;
  phone: string;
  email: string;
}

export default function CardSignupPage({ params }: CardSignupPageProps) {
  const { slug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [business, setBusiness] = useState<{ id: string; name: string } | null>(null);
  const [createdCustomer, setCreatedCustomer] = useState<PublicCustomer | null>(null);

  const [formData, setFormData] = useState<SignupFormData>({
    full_name: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    async function fetchBusiness() {
      setLoading(true);
      try {
        const businessData = await getBusinessBySlug(slug);

        if (!businessData) {
          setError('Business not found');
          return;
        }

        setBusiness({ id: businessData.id, name: businessData.name });
      } catch {
        setError('Something went wrong');
      } finally {
        setLoading(false);
      }
    }

    fetchBusiness();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!business) return;

    setSubmitting(true);
    setError(null);

    try {
      const result = await signUpForLoyaltyCard({
        business_id: business.id,
        full_name: formData.full_name,
        phone: formData.phone,
        email: formData.email || null,
      });

      setCreatedCustomer(result.customer);
      setSuccess(true);
    } catch {
      setError('Failed to join loyalty program. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !business) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => router.push(`/business/${slug}`)}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success && createdCustomer) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="mb-2 text-2xl font-semibold">Welcome to the Club!</h2>
            <p className="mb-6 text-muted-foreground">
              You&apos;ve joined {business?.name}&apos;s loyalty program.
            </p>

            {createdCustomer.card_token && (
              <div className="mb-6 rounded-lg bg-muted p-4">
                <p className="mb-2 text-sm text-muted-foreground">Your Card Code</p>
                <p className="font-mono text-2xl font-bold tracking-wider">
                  {createdCustomer.card_token}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Show this code when making purchases to earn points
                </p>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                onClick={() =>
                  router.push(
                    `/business/${slug}/my-card?code=${createdCustomer.card_token}`
                  )
                }
              >
                <CreditCard className="mr-2 h-4 w-4" />
                View My Card
              </Button>
              <Button variant="outline" onClick={() => router.push(`/business/${slug}`)}>
                Back to Store
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Join Our Loyalty Program</CardTitle>
          <CardDescription>
            Sign up to earn points and unlock rewards at {business?.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">
                <User className="mr-1 inline h-4 w-4" />
                Full Name *
              </Label>
              <Input
                id="name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">
                <Phone className="mr-1 inline h-4 w-4" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
                placeholder="09XX XXX XXXX"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">
                <Mail className="mr-1 inline h-4 w-4" />
                Email (optional)
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="your@email.com"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={!formData.full_name || !formData.phone || submitting}
            >
              {submitting ? 'Signing up...' : 'Get My Loyalty Card'}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing up, you agree to receive updates about rewards and promotions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
