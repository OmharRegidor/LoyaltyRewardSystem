// apps/web/app/business/[slug]/services/page.tsx

import { notFound } from 'next/navigation';
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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Phone, Sparkles } from 'lucide-react';

interface ServicesPageProps {
  params: Promise<{ slug: string }>;
}

function formatPrice(centavos: number): string {
  const pesos = centavos / 100;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(pesos);
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours} hr${hours > 1 ? 's' : ''}`;
  }
  return `${hours} hr ${remainingMins} min`;
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);

  if (!business) {
    notFound();
  }

  const services = await getPublicServices(business.id);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Our Services</h1>
        <p className="text-muted-foreground">
          Browse our available services and book your appointment
        </p>
      </div>

      {/* Services Grid */}
      {services.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg">{service.name}</CardTitle>
                </div>
                {service.description && (
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(service.duration_minutes)}
                  </Badge>
                  {service.price_centavos && (
                    <Badge variant="secondary">
                      {formatPrice(service.price_centavos)}
                    </Badge>
                  )}
                </div>
                <Button className="w-full" disabled>
                  Book Now
                </Button>
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
            <h3 className="text-lg font-semibold mb-2">No Services Available</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              This business hasn&apos;t added any services yet. Check back later
              or contact them directly.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Contact CTA */}
      {business.phone && (
        <Card className="mt-8 bg-muted/30">
          <CardContent className="py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold mb-1">Need help booking?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact us directly for assistance with your appointment
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href={`tel:${business.phone}`}>
                  <Phone className="mr-2 h-4 w-4" />
                  {business.phone}
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
