'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { LinkedCustomer } from '@/types/pos.types';

interface CustomerSearchProps {
  onCustomerFound: (customer: LinkedCustomer) => void;
  disabled?: boolean;
}

export function CustomerSearch({ onCustomerFound, disabled }: CustomerSearchProps) {
  const [phone, setPhone] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!phone.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/dashboard/pos/customer?phone=${encodeURIComponent(phone)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search customer');
      }

      if (data.customer) {
        onCustomerFound(data.customer);
        setPhone('');
      } else {
        setError('Customer not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [phone, onCustomerFound]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="tel"
            placeholder="Search by phone number..."
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            className="pl-9"
            disabled={disabled || isSearching}
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleSearch}
          disabled={disabled || isSearching || !phone.trim()}
        >
          {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
