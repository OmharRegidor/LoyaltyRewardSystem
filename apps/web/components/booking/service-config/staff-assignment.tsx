'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { getStaffForServiceAssignment } from '@/lib/services/booking.service';
import type { ServiceFormData } from '@/types/booking.types';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  is_assigned?: boolean;
}

interface StaffAssignmentProps {
  formData: ServiceFormData;
  setFormData: React.Dispatch<React.SetStateAction<ServiceFormData>>;
  businessId: string;
  serviceId?: string;
  disabled?: boolean;
}

export function StaffAssignment({
  formData,
  setFormData,
  businessId,
  serviceId,
  disabled,
}: StaffAssignmentProps) {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, [businessId, serviceId]);

  const loadStaff = async () => {
    setIsLoading(true);
    try {
      const staffList = await getStaffForServiceAssignment(businessId, serviceId);
      setStaff(staffList);

      // Initialize selected staff from assignments
      const assigned = new Set(
        staffList.filter((s) => s.is_assigned).map((s) => s.id)
      );
      setSelectedStaffIds(assigned);
    } catch (error) {
      console.error('Error loading staff:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStaff = (staffId: string) => {
    setSelectedStaffIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(staffId)) {
        newSet.delete(staffId);
      } else {
        newSet.add(staffId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedStaffIds(new Set(staff.map((s) => s.id)));
  };

  const selectNone = () => {
    setSelectedStaffIds(new Set());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (staff.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No staff members found</p>
        <p className="text-xs text-gray-500 mt-1">
          Add staff members in the Staff section first
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Allow Staff Selection Toggle */}
      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-white">
        <div className="space-y-0.5">
          <Label htmlFor="staff_selection" className="text-gray-900">Allow Customer Staff Selection</Label>
          <p className="text-xs text-gray-500">
            Let customers choose their preferred staff member when booking
          </p>
        </div>
        <Switch
          id="staff_selection"
          checked={formData.allow_staff_selection || false}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({ ...prev, allow_staff_selection: checked }))
          }
          disabled={disabled}
        />
      </div>

      {/* Staff List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-gray-900">Assign Staff to This Service</Label>
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={selectAll}
              disabled={disabled}
              className="text-gray-900 hover:underline disabled:opacity-50"
            >
              Select All
            </button>
            <span className="text-gray-500">|</span>
            <button
              type="button"
              onClick={selectNone}
              disabled={disabled}
              className="text-gray-900 hover:underline disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-auto bg-white">
          {staff.map((member) => (
            <label
              key={member.id}
              className={`flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer ${
                disabled ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Checkbox
                checked={selectedStaffIds.has(member.id)}
                onCheckedChange={() => toggleStaff(member.id)}
                disabled={disabled}
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500 capitalize">{member.role}</p>
              </div>
            </label>
          ))}
        </div>

        <p className="text-xs text-gray-500">
          {selectedStaffIds.size} of {staff.length} staff selected
        </p>
      </div>
    </div>
  );
}

