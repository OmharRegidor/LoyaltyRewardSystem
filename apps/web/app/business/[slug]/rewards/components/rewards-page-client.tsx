// apps/web/app/business/[slug]/rewards/components/rewards-page-client.tsx
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Sparkles } from 'lucide-react';
import type {
  PublicBusiness,
  PublicReward,
} from '@/lib/services/public-business.service';

// ============================================
// TYPES
// ============================================

interface RewardsPageClientProps {
  business: PublicBusiness;
  rewards: PublicReward[];
}

// ============================================
// ANIMATION VARIANTS
// ============================================

const containerVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.2,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

// ============================================
// MAIN COMPONENT
// ============================================

export function RewardsPageClient({
  business,
  rewards,
}: RewardsPageClientProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 dark:bg-primary/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-secondary/10 dark:bg-secondary/5 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute bottom-20 left-1/2 w-64 sm:w-96 h-64 sm:h-96 bg-primary/5 dark:bg-primary/3 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          className="mb-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
              <Gift className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Rewards Catalog</h1>
              <p className="text-muted-foreground text-base sm:text-lg">
                Earn points and redeem them for these rewards
              </p>
            </div>
          </div>
        </motion.div>

        {/* Rewards Grid */}
        {rewards.length > 0 ? (
          <motion.div
            className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
          >
            {rewards.map((reward) => (
              <motion.div key={reward.id} variants={cardVariants}>
                <Card className="overflow-hidden flex flex-col h-full group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />

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
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10">
                          <Gift className="h-12 w-12 text-primary/50" />
                        </div>
                      </div>
                    )}

                    {/* Category Badge */}
                    {reward.category && (
                      <Badge className="absolute top-3 left-3 capitalize bg-gradient-to-r from-primary/90 to-secondary/90 text-white border-0 shadow-md">
                        {reward.category}
                      </Badge>
                    )}

                    {/* Stock Badge */}
                    {reward.stock !== null && reward.stock <= 10 && (
                      <Badge
                        variant="destructive"
                        className="absolute top-3 right-3 shadow-md"
                      >
                        {reward.stock} left
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-2 relative">
                    <CardTitle className="text-base line-clamp-1">
                      {reward.title}
                    </CardTitle>
                    {reward.description && (
                      <CardDescription className="line-clamp-2 text-xs">
                        {reward.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0 mt-auto relative">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                      <Star className="h-5 w-5 fill-primary text-primary" />
                      <span className="font-bold text-primary">
                        {reward.points_cost.toLocaleString()}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        points
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <Card className="text-center py-12 border-border/50">
              <CardContent>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 mb-4">
                  <Sparkles className="h-10 w-10 text-primary/60" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  No Rewards Available
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  This business hasn&apos;t added any rewards yet. Check back
                  later for exciting rewards!
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* How to Earn Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="mt-10 overflow-hidden border-primary/20 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 pointer-events-none" />
            <CardContent className="py-6 relative">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-primary to-secondary text-white shadow-lg">
                  <Star className="h-7 w-7" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-lg mb-1">
                    How to Earn Points
                  </h3>
                  <p className="text-muted-foreground">
                    {business.points_per_purchase ? (
                      <>
                        Earn{' '}
                        <span className="font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
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
        </motion.div>

        {/* How to Redeem */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="mt-4 overflow-hidden border-primary/20 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-primary/5 pointer-events-none" />
            <CardContent className="py-6 relative">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-secondary to-primary text-white shadow-lg">
                  <Gift className="h-7 w-7" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="font-semibold text-lg mb-1">How to Redeem</h3>
                  <p className="text-muted-foreground">
                    Visit us in-store to redeem your rewards. Show your points
                    balance to our staff and choose from our available rewards!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
