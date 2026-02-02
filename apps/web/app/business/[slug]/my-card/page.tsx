// apps/web/app/business/[slug]/my-card/page.tsx

import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Gift, Star, CreditCard } from 'lucide-react';
import { createServiceClient } from '@/lib/supabase-server';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MyCardPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
}

interface Customer {
  id: string;
  full_name: string | null;
  total_points: number | null;
  lifetime_points: number | null;
  tier: string | null;
  card_token: string | null;
  qr_code_url: string | null;
}

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  category: string | null;
}

function getTierColor(tier: string | null): string {
  switch (tier?.toLowerCase()) {
    case 'gold':
      return 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400';
    case 'silver':
      return 'bg-gray-400/20 text-gray-600 dark:text-gray-300';
    case 'platinum':
      return 'bg-purple-500/20 text-purple-600 dark:text-purple-400';
    default:
      return 'bg-orange-500/20 text-orange-600 dark:text-orange-400';
  }
}

function getTierLabel(tier: string | null): string {
  if (!tier) return 'Bronze';
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

async function getCardData(slug: string, cardToken: string) {
  const supabase = createServiceClient();

  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, logo_url')
    .eq('slug', slug)
    .maybeSingle();

  if (businessError || !business) {
    return null;
  }

  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('id, full_name, total_points, lifetime_points, tier, card_token, qr_code_url')
    .eq('card_token', cardToken)
    .maybeSingle();

  if (customerError || !customer) {
    return { business, customer: null, rewards: [], isLinked: false };
  }

  // Check if customer is linked to this business
  const { data: link } = await supabase
    .from('customer_businesses')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('business_id', business.id)
    .maybeSingle();

  if (!link) {
    return { business, customer: null, rewards: [], isLinked: false };
  }

  // Fetch available rewards for this business
  const { data: rewards } = await supabase
    .from('rewards')
    .select('id, title, description, points_cost, image_url, category')
    .eq('business_id', business.id)
    .eq('is_visible', true)
    .eq('is_active', true)
    .order('points_cost', { ascending: true });

  return {
    business,
    customer: customer as Customer,
    rewards: (rewards || []) as Reward[],
    isLinked: true,
  };
}

export default async function MyCardPage({ params, searchParams }: MyCardPageProps) {
  const { slug } = await params;
  const { code } = await searchParams;

  if (!code) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Card Code Required</h2>
            <p className="mb-6 text-muted-foreground">
              Please use the link from your loyalty card to view your points.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/business/${slug}/card`}>Get a Loyalty Card</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/business/${slug}`}>Back to Store</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const data = await getCardData(slug, code);

  if (!data) {
    notFound();
  }

  const { business, customer, rewards, isLinked } = data;

  if (!customer || !isLinked) {
    return (
      <div className="container mx-auto max-w-md px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Card Not Found</h2>
            <p className="mb-6 text-muted-foreground">
              This loyalty card is not registered with {business.name}.
            </p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <Link href={`/business/${slug}/card`}>Join Loyalty Program</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/business/${slug}`}>Back to Store</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const availableRewards = rewards.filter(
    (r) => (customer.total_points || 0) >= r.points_cost
  );

  return (
    <div className="container mx-auto max-w-md px-4 py-8">
      {/* Loyalty Card Display */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
                  {business.name.charAt(0)}
                </div>
              )}
              <span className="font-medium">{business.name}</span>
            </div>
            <Badge className={getTierColor(customer.tier)}>
              <Star className="mr-1 h-3 w-3" />
              {getTierLabel(customer.tier)}
            </Badge>
          </div>

          <p className="mb-1 text-sm opacity-80">{customer.full_name || 'Member'}</p>

          <div className="mt-4">
            <p className="text-sm opacity-80">Points Balance</p>
            <p className="text-4xl font-bold">{customer.total_points || 0}</p>
          </div>

          {customer.card_token && (
            <div className="mt-4 border-t border-white/20 pt-4">
              <p className="text-xs opacity-70">Card Code</p>
              <p className="font-mono text-lg tracking-wider">{customer.card_token}</p>
            </div>
          )}
        </div>

        <CardContent className="py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Lifetime Points</span>
            <span className="font-medium">{customer.lifetime_points || 0}</span>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Section */}
      {customer.qr_code_url && (
        <Card className="mb-6">
          <CardHeader className="pb-2 text-center">
            <CardTitle className="text-base">Your QR Code</CardTitle>
            <CardDescription>Show this when making purchases</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <div className="rounded-lg bg-white p-4">
              <Image
                src={customer.qr_code_url}
                alt="Your loyalty QR code"
                width={160}
                height={160}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Rewards */}
      {rewards.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Available Rewards</CardTitle>
            </div>
            {availableRewards.length > 0 && (
              <CardDescription>
                You can redeem {availableRewards.length} reward
                {availableRewards.length !== 1 ? 's' : ''}!
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            {rewards.map((reward) => {
              const canRedeem = (customer.total_points || 0) >= reward.points_cost;
              return (
                <div
                  key={reward.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    canRedeem ? 'border-primary/50 bg-primary/5' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {reward.image_url ? (
                      <Image
                        src={reward.image_url}
                        alt={reward.title}
                        width={40}
                        height={40}
                        className="rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                        <Gift className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{reward.title}</p>
                      {reward.category && (
                        <p className="text-xs text-muted-foreground">{reward.category}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={canRedeem ? 'default' : 'secondary'}>
                    {reward.points_cost} pts
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* No Rewards Available */}
      {rewards.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Gift className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No rewards available yet. Check back soon!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="mt-6 text-center">
        <Button asChild variant="outline" className="w-full">
          <Link href={`/business/${slug}`}>Back to Store</Link>
        </Button>
      </div>
    </div>
  );
}
