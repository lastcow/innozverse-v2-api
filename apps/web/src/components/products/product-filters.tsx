'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const productTypes = [
  { value: 'all', label: 'All Products' },
  { value: 'LAPTOP', label: 'Laptops' },
  { value: 'SURFACE', label: 'Surface' },
  { value: 'XBOX', label: 'Xbox' },
];

interface ProductFiltersProps {
  currentType?: string;
}

export function ProductFilters({ currentType }: ProductFiltersProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get('search');

  const buildUrl = (type: string) => {
    const params = new URLSearchParams();
    if (type !== 'all') {
      params.set('type', type);
    }
    if (search) {
      params.set('search', search);
    }
    return `/products${params.toString() ? `?${params.toString()}` : ''}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Categories</h2>
      <nav className="space-y-2">
        {productTypes.map((type) => {
          const isActive = currentType === type.value || (!currentType && type.value === 'all');
          return (
            <Link
              key={type.value}
              href={buildUrl(type.value)}
              className={`block px-3 py-2 rounded-md text-sm font-medium transition ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
