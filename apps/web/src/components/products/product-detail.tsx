'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ShoppingCart, MapPin, Tag, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/useCartStore';
import { formatCurrency } from '@/lib/utils';
import {
  calculateDiscountBreakdown,
  getActiveEventDiscount,
  formatDiscountPercentage,
} from '@/lib/discount';
import { getStudentVerificationStatus } from '@/app/actions/student';
import type { EventDiscount } from '@repo/types';

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    type: string;
    imageUrls: string[];
    properties: Record<string, any>;
    stock: number;
    active: boolean;
    studentDiscountPercentage?: number | null;
  };
  activeEventDiscounts?: EventDiscount[];
}

export function ProductDetail({ product, activeEventDiscounts = [] }: ProductDetailProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [isStudent, setIsStudent] = useState(false);

  useEffect(() => {
    getStudentVerificationStatus()
      .then((result) => {
        if (result.status === 'APPROVED') setIsStudent(true);
      })
      .catch(() => {});
  }, []);

  const imageUrl =
    Array.isArray(product.imageUrls) && product.imageUrls.length > 0
      ? product.imageUrls[0]!
      : '/placeholder.png';

  const basePrice = parseFloat(product.basePrice.toString());
  const hasStudentDiscount =
    isStudent && product.studentDiscountPercentage != null && product.studentDiscountPercentage > 0;
  const activeEventDiscount = getActiveEventDiscount(activeEventDiscounts);
  const hasEventDiscount = activeEventDiscount !== null && activeEventDiscount.percentage > 0;
  const hasAnyDiscount = hasStudentDiscount || hasEventDiscount;

  const discountBreakdown = calculateDiscountBreakdown(
    basePrice,
    hasStudentDiscount ? product.studentDiscountPercentage : null,
    hasEventDiscount ? activeEventDiscount!.percentage : null
  );
  const finalPrice = discountBreakdown.finalPrice;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image: imageUrl,
    });
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Image */}
      <div className="relative aspect-square bg-gray-200 rounded-lg overflow-hidden">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
      </div>

      {/* Details */}
      <div className="space-y-6">
        <div>
          <span className="text-sm font-medium text-primary-600 uppercase">
            {product.type}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{product.name}</h1>

          {/* Discount Badges */}
          {hasAnyDiscount && (
            <div className="flex flex-wrap gap-2 mt-3">
              {hasEventDiscount && (
                <Badge className="bg-green-600 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {activeEventDiscount!.name} -{formatDiscountPercentage(activeEventDiscount!.percentage)}
                </Badge>
              )}
              {hasStudentDiscount && (
                <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Student -{formatDiscountPercentage(Number(product.studentDiscountPercentage))}
                </Badge>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="mt-4 space-y-1">
            {hasAnyDiscount ? (
              <>
                <span className="text-slate-400 line-through text-lg">
                  ${formatCurrency(basePrice)}
                </span>
                <p className="text-3xl font-bold text-blue-600">
                  ${formatCurrency(finalPrice)}
                </p>
                <div className="text-xs text-green-600 font-medium space-y-0.5">
                  {discountBreakdown.studentDiscountAmount > 0 && (
                    <p>Student discount: -${formatCurrency(discountBreakdown.studentDiscountAmount)}</p>
                  )}
                  {discountBreakdown.eventDiscountAmount > 0 && (
                    <p>Event discount: -${formatCurrency(discountBreakdown.eventDiscountAmount)}</p>
                  )}
                  <p className="font-semibold">
                    Total savings: ${formatCurrency(discountBreakdown.totalDiscountAmount)}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                ${formatCurrency(basePrice)}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-b py-4">
          {product.stock > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-medium">In Stock</span>
              {product.stock <= 5 && (
                <span className="text-blue-600 text-sm">
                  (Only {product.stock} left)
                </span>
              )}
            </div>
          ) : (
            <span className="text-red-600 font-medium">Out of Stock</span>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
          <p className="text-gray-600">{product.description}</p>
        </div>

        {product.properties && Object.keys(product.properties).length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Specifications</h2>
            <dl className="space-y-2">
              {Object.entries(product.properties).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <dt className="text-gray-600 capitalize">{key}:</dt>
                  <dd className="text-gray-900 font-medium">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-5 h-5" />
            Add to Cart
          </button>
          <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 p-3">
            <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700">
              <span className="font-semibold">Local Pickup Only.</span>{' '}
              All physical items must be picked up at our company location. No shipping is available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
