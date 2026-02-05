// apps/web/app/dashboard/booking/services/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/layout';
import { ServiceConfigDialog } from '@/components/booking/service-config';
import { DeleteServiceDialog } from '@/components/booking/delete-service-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UpgradeModal } from '@/components/upgrade-modal';
import { useSubscriptionGate } from '@/hooks/useSubscriptionGate';
import { createClient } from '@/lib/supabase';
import {
  getServices,
  createServiceWithConfig,
  updateServiceWithConfig,
  deleteService,
  getBranches,
  getBusinessType,
} from '@/lib/services/booking.service';
import { motion } from 'framer-motion';
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-react';
import type { Service, ServiceFormData, Branch, BusinessType } from '@/types/booking.types';

// ============================================
// HELPERS
// ============================================

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  return `${hours} hr ${remainingMinutes} min`;
}

function formatPrice(centavos: number | null): string {
  if (centavos === null) return '-';
  return `₱${(centavos / 100).toFixed(0)}`;
}

// ============================================
// LOADING SKELETON
// ============================================

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="rounded-lg border">
        <div className="p-4 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100  flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900  mb-1">
        No services yet
      </h3>
      <p className="text-sm text-gray-500  mb-4 max-w-sm">
        Create your first service to start accepting bookings.
      </p>
      <Button onClick={onAdd}>
        <Plus className="w-4 h-4 mr-2" />
        Add Service
      </Button>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function ServicesPage() {
  const { checkAndGate, showUpgradeModal, setShowUpgradeModal } =
    useSubscriptionGate();

  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessType, setBusinessType] = useState<BusinessType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('id, business_type')
        .eq('owner_id', user.id)
        .single();

      if (!business) return;
      setBusinessId(business.id);
      setBusinessType((business.business_type as BusinessType) || null);

      const [servicesData, branchesData] = await Promise.all([
        getServices(business.id),
        getBranches(business.id),
      ]);

      setServices(servicesData);
      setBranches(branchesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleAddClick = () => {
    if (checkAndGate('Add Service')) {
      setIsCreateOpen(true);
    }
  };

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsEditOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setIsDeleteOpen(true);
  };

  const handleCreate = async (data: ServiceFormData) => {
    if (!businessId) return;

    const newService = await createServiceWithConfig({
      ...data,
      business_id: businessId,
    });

    setServices((prev) => [newService, ...prev]);
  };

  const handleUpdate = async (data: ServiceFormData) => {
    if (!selectedService) return;

    const updatedService = await updateServiceWithConfig(selectedService.id, data);

    setServices((prev) =>
      prev.map((s) => (s.id === updatedService.id ? updatedService : s))
    );
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    await deleteService(selectedService.id);

    setServices((prev) => prev.filter((s) => s.id !== selectedService.id));
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingSkeleton />
      </DashboardLayout>
    );
  }

  // ============================================
  // RENDER
  // ============================================

  return (
    <DashboardLayout>
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 ">
              Services
            </h1>
            <p className="text-sm text-gray-500  mt-1">
              Manage the services customers can book
            </p>
          </div>
          <Button onClick={handleAddClick}>
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {/* Content */}
        {services.length === 0 ? (
          <EmptyState onAdd={handleAddClick} />
        ) : (
          <div className="rounded-lg border bg-white /50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{formatDuration(service.duration_minutes)}</TableCell>
                    <TableCell>{formatPrice(service.price_centavos)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={service.is_active ? 'default' : 'secondary'}
                        className={
                          service.is_active
                            ? 'bg-green-100 text-green-700'
                            : ''
                        }
                      >
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleEditClick(service)}
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(service)}
                            variant="destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Dialog */}
        {businessId && (
          <ServiceConfigDialog
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            onSave={handleCreate}
            branches={branches}
            businessId={businessId}
            businessType={businessType}
            mode="create"
          />
        )}

        {/* Edit Dialog */}
        {businessId && (
          <ServiceConfigDialog
            isOpen={isEditOpen}
            onClose={() => {
              setIsEditOpen(false);
              setSelectedService(null);
            }}
            onSave={handleUpdate}
            service={selectedService}
            branches={branches}
            businessId={businessId}
            businessType={businessType}
            mode="edit"
          />
        )}

        {/* Delete Dialog */}
        <DeleteServiceDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedService(null);
          }}
          onConfirm={handleDelete}
          service={selectedService}
        />

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          feature="Add Service"
        />
      </motion.div>
    </DashboardLayout>
  );
}
