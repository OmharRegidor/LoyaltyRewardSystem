// apps/web/app/business/[slug]/page.tsx

import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  getBusinessBySlug,
  getPublicAvailability,
} from '@/lib/services/public-business.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  MapPin,
  Phone,
  Calendar,
  Gift,
  Star,
  Clock,
} from 'lucide-react';

interface BusinessPageProps {
  params: Promise<{ slug: string }>;
}

const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

function formatTime(time: string): string {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default async function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const availability = await getPublicAvailability(business.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
          {business.logo_url ? (
            <Image
              src={business.logo_url}
              alt={business.name}
              width={80}
              height={80}
              className="rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold">{business.name}</h1>
              {business.business_type && (
                <Badge variant="secondary">{business.business_type}</Badge>
              )}
            </div>
            {business.description && (
              <p className="text-muted-foreground max-w-2xl">
                {business.description}
              </p>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/business/${slug}/services`}>
              <Calendar className="mr-2 h-4 w-4" />
              Book a Service
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/business/${slug}/rewards`}>
              <Gift className="mr-2 h-4 w-4" />
              View Rewards
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(business.address || business.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {business.address && <p>{business.address}</p>}
                  {business.city && (
                    <p className="text-muted-foreground">{business.city}</p>
                  )}
                </div>
              </div>
            )}

            {business.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`tel:${business.phone}`}
                  className="text-primary hover:underline"
                >
                  {business.phone}
                </a>
              </div>
            )}

            {!business.address && !business.city && !business.phone && (
              <p className="text-muted-foreground text-sm">
                No contact information available.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Loyalty Program */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-primary" />
              Loyalty Program
            </CardTitle>
            <CardDescription>
              Earn points with every purchase
            </CardDescription>
          </CardHeader>
          <CardContent>
            {business.points_per_purchase || business.pesos_per_point ? (
              <div className="space-y-2">
                {business.points_per_purchase && (
                  <p className="text-lg">
                    Earn{' '}
                    <span className="font-semibold text-primary">
                      {business.points_per_purchase} points
                    </span>{' '}
                    per purchase
                  </p>
                )}
                {business.pesos_per_point && (
                  <p className="text-sm text-muted-foreground">
                    {business.pesos_per_point} peso(s) = 1 point
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Contact the business for loyalty program details.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Business Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availability.length > 0 ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {DAY_NAMES.map((dayName, index) => {
                  const dayAvailability = availability.find(
                    (a) => a.day_of_week === index
                  );

                  return (
                    <div
                      key={index}
                      className="flex justify-between items-center py-2 px-3 rounded-lg bg-muted/50"
                    >
                      <span className="font-medium">{dayName}</span>
                      {dayAvailability && dayAvailability.is_available ? (
                        <span className="text-sm text-muted-foreground">
                          {formatTime(dayAvailability.start_time)} -{' '}
                          {formatTime(dayAvailability.end_time)}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Closed
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Business hours not available. Please contact the business for
                their schedule.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
