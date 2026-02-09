'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const roleOptions = [
  { value: 'all', label: 'All Roles' },
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SYSTEM', label: 'System' },
];

interface UserFiltersProps {
  currentRole?: string;
}

export function UserFilters({ currentRole }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = useCallback(
    (role: string) => {
      const params = new URLSearchParams();
      const search = searchParams.get('search');

      if (role !== 'all') {
        params.set('role', role);
      }
      if (search) {
        params.set('search', search);
      }
      // Reset to page 1 when filtering
      return `/admin/users${params.toString() ? `?${params.toString()}` : ''}`;
    },
    [searchParams]
  );

  const handleRoleChange = (value: string) => {
    router.push(buildUrl(value));
  };

  return (
    <Select
      value={currentRole || 'all'}
      onValueChange={handleRoleChange}
    >
      <SelectTrigger className="w-[160px] rounded-xl border-gray-200 focus:ring-[#4379EE]">
        <SelectValue placeholder="Filter by role" />
      </SelectTrigger>
      <SelectContent>
        {roleOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
