// apps/web/app/business/[slug]/services/page.tsx

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Clock, Calendar } from 'lucide-react';
import {
  getBusinessBySlug,
  getPublicServices,
} from '@/lib/services/public-business.service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ServicesPageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(centavos: number | null): string {
  if (centavos === null) return 'Free';
  return `₱${(centavos / 100).toFixed(0)}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

async function getServicesData(slug: string) {
  const business = await getBusinessBySlug(slug);

  if (!business) {
    return null;
  }

  const services = await getPublicServices(business.id);

  return {
    business,
    services,
  };
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { slug } = await params;
  const data = await getServicesData(slug);

  if (!data) {
    notFound();
  }

  const { services } = data;

  if (services.length === 0) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="py-12 text-center">
          <Calendar className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h2 className="mb-2 text-xl font-semibold">No Services Available</h2>
          <p className="mb-6 text-muted-foreground">
            This business hasn&apos;t added any services yet.
          </p>
          <Button asChild variant="outline">
            <Link href={`/business/${slug}`}>Back to Store</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold">Our Services</h1>
        <p className="text-muted-foreground">
          Browse our services and book an appointment
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {services.map((service) => (
          <Card key={service.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <span className="shrink-0 font-semibold text-primary">
                  {formatPrice(service.price_centavos)}
                </span>
              </div>
              <Badge variant="secondary" className="w-fit">
                <Clock className="mr-1 h-3 w-3" />
                {formatDuration(service.duration_minutes)}
              </Badge>
            </CardHeader>
            {service.description && (
              <CardContent className="flex-1">
                <CardDescription>{service.description}</CardDescription>
              </CardContent>
            )}
            <CardContent className={service.description ? 'pt-0' : ''}>
              <Button asChild className="w-full">
                <Link href={`/business/${slug}/book/${service.id}`}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Book Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
