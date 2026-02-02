// apps/web/app/business/[slug]/page.tsx

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Phone, Gift, Calendar } from 'lucide-react';
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

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

interface Business {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  description: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
}

interface Reward {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  image_url: string | null;
  category: string | null;
}

interface Plan {
  has_booking: boolean;
}

interface Subscription {
  plan_id: string | null;
  plans: Plan | null;
}

async function getBusinessData(slug: string) {
  const supabase = createServiceClient();

  // Fetch business details
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url, description, address, city, phone')
    .eq('slug', slug)
    .maybeSingle();

  if (businessError || !business) {
    return null;
  }

  // Fetch visible rewards
  const { data: rewards } = await supabase
    .from('rewards')
    .select('id, title, description, points_cost, image_url, category')
    .eq('business_id', business.id)
    .eq('is_visible', true)
    .eq('is_active', true)
    .order('points_cost', { ascending: true });

  // Check if business has booking enabled via their subscription plan
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan_id, plans:plan_id(has_booking)')
    .eq('business_id', business.id)
    .eq('status', 'active')
    .maybeSingle();

  const hasBooking =
    (subscription as Subscription | null)?.plans?.has_booking ?? false;

  return {
    business: business as Business,
    rewards: (rewards || []) as Reward[],
    hasBooking,
  };
}

export default async function BusinessStorefrontPage({
  params,
}: BusinessPageProps) {
  const { slug } = await params;
  const data = await getBusinessData(slug);

  if (!data) {
    notFound();
  }

  const { business, rewards, hasBooking } = data;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Business Info Section */}
      <section className="mb-12">
        <div className="flex flex-col items-center text-center">
          {business.logo_url && (
            <Image
              src={business.logo_url}
              alt={business.name}
              width={120}
              height={120}
              className="mb-4 rounded-full object-cover"
            />
          )}
          <h1 className="mb-2 text-3xl font-bold">{business.name}</h1>
          {business.description && (
            <p className="mb-4 max-w-2xl text-muted-foreground">
              {business.description}
            </p>
          )}

          {/* Contact Info */}
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            {(business.address || business.city) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>
                  {[business.address, business.city].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            {business.phone && (
              <div className="flex items-center gap-1">
                <Phone className="h-4 w-4" />
                <a href={`tel:${business.phone}`} className="hover:underline">
                  {business.phone}
                </a>
              </div>
            )}
          </div>

          {/* Book Now CTA */}
          {hasBooking && (
            <div className="mt-6">
              <Button asChild size="lg">
                <Link href={`/business/${slug}/book`}>
                  <Calendar className="mr-2 h-5 w-5" />
                  Book an Appointment
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Rewards Section */}
      {rewards.length > 0 && (
        <section>
          <div className="mb-6 flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold">Available Rewards</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rewards.map((reward) => (
              <Card key={reward.id}>
                {reward.image_url && (
                  <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
                    <Image
                      src={reward.image_url}
                      alt={reward.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{reward.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {reward.points_cost} pts
                    </Badge>
                  </div>
                  {reward.category && (
                    <Badge variant="outline" className="w-fit">
                      {reward.category}
                    </Badge>
                  )}
                </CardHeader>
                {reward.description && (
                  <CardContent>
                    <CardDescription>{reward.description}</CardDescription>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>
              Download the NoxaLoyalty app to earn points and redeem rewards!
            </p>
          </div>
        </section>
      )}

      {/* Empty State */}
      {rewards.length === 0 && !hasBooking && (
        <div className="py-12 text-center">
          <Gift className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">Coming Soon</h2>
          <p className="text-muted-foreground">
            This business is setting up their rewards program. Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
