'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UserSearchProps {
  currentSearch?: string;
}

export function UserSearch({ currentSearch }: UserSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(currentSearch || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync input if parent search changes (e.g. clear from outside)
  useEffect(() => {
    setValue(currentSearch || '');
  }, [currentSearch]);

  const buildUrl = useCallback(
    (search: string) => {
      const params = new URLSearchParams();
      const role = searchParams.get('role');
      if (search.trim()) params.set('search', search.trim());
      if (role) params.set('role', role);
      return `/admin/users${params.toString() ? `?${params.toString()}` : ''}`;
    },
    [searchParams]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      router.push(buildUrl(v));
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(buildUrl(value));
  };

  const handleClear = () => {
    setValue('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    router.push(buildUrl(''));
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <Input
        type="text"
        placeholder="Search by name or email..."
        value={value}
        onChange={handleChange}
        className="pl-9 pr-9 rounded-xl border-gray-200 focus-visible:ring-[#4379EE]"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
