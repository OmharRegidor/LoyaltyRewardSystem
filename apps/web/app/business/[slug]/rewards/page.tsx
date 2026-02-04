// apps/web/app/business/[slug]/rewards/page.tsx

import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  getBusinessBySlug,
  getPublicRewards,
} from '@/lib/services/public-business.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Sparkles } from 'lucide-react';

interface RewardsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function RewardsPage({ params }: RewardsPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const rewards = await getPublicRewards(business.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rewards Catalog</h1>
        <p className="text-muted-foreground">
          Earn points and redeem them for these rewards
        </p>
      </div>

      {/* Rewards Grid */}
      {rewards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rewards.map((reward) => (
            <Card key={reward.id} className="overflow-hidden flex flex-col">
              {/* Reward Image */}
              <div className="relative aspect-square bg-muted">
                {reward.image_url ? (
                  <Image
                    src={reward.image_url}
                    alt={reward.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gift className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}

                {/* Category Badge */}
                {reward.category && (
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 capitalize"
                  >
                    {reward.category}
                  </Badge>
                )}

                {/* Stock Badge */}
                {reward.stock !== null && reward.stock <= 10 && (
                  <Badge
                    variant="destructive"
                    className="absolute top-2 right-2"
                  >
                    {reward.stock} left
                  </Badge>
                )}
              </div>

              <CardHeader className="pb-2">
                <CardTitle className="text-base line-clamp-1">
                  {reward.title}
                </CardTitle>
                {reward.description && (
                  <CardDescription className="line-clamp-2 text-xs">
                    {reward.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pt-0 mt-auto">
                <div className="flex items-center gap-1 text-primary font-semibold">
                  <Star className="h-4 w-4 fill-primary" />
                  <span>{reward.points_cost.toLocaleString()} points</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
              <Sparkles className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Rewards Available</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              This business hasn&apos;t added any rewards yet. Check back later
              for exciting rewards!
            </p>
          </CardContent>
        </Card>
      )}

      {/* How to Earn Points */}
      <Card className="mt-8 bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold mb-1">How to Earn Points</h3>
              <p className="text-sm text-muted-foreground">
                {business.points_per_purchase ? (
                  <>
                    Earn{' '}
                    <span className="font-medium text-primary">
                      {business.points_per_purchase} points
                    </span>{' '}
                    with every purchase
                    {business.pesos_per_point &&
                      ` (${business.pesos_per_point} peso = 1 point)`}
                    . Download our app or visit in-store to start earning!
                  </>
                ) : (
                  <>
                    Visit in-store or download our app to learn about our
                    loyalty program and start earning points!
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
