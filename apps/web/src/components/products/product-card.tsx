import Link from 'next/link';
import Image from 'next/image';
import type { EventDiscount } from '@repo/types';
import {
  calculateDiscountBreakdown,
  formatDiscountPercentage,
} from '@/lib/discount';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    type: string;
    imageUrls: string[];
    active: boolean;
    stock: number;
    studentDiscountPercentage?: number | null;
  };
  showStudentPricing?: boolean;
  activeEventDiscount?: EventDiscount | null;
}

export function ProductCard({
  product,
  showStudentPricing = false,
  activeEventDiscount = null,
}: ProductCardProps) {
  const imageUrl = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls[0]!
    : '/placeholder.png';

  const basePrice = parseFloat(product.basePrice.toString());
  const hasStudentDiscount = product.studentDiscountPercentage && product.studentDiscountPercentage > 0;
  const hasEventDiscount = activeEventDiscount !== null && activeEventDiscount.percentage > 0;

  // Calculate discount breakdown using utility function
  const studentDiscountPercentage = showStudentPricing && hasStudentDiscount
    ? product.studentDiscountPercentage
    : null;
  const eventDiscountPercentage = hasEventDiscount ? activeEventDiscount.percentage : null;

  const discountBreakdown = calculateDiscountBreakdown(
    basePrice,
    studentDiscountPercentage,
    eventDiscountPercentage
  );

  const hasAnyDiscount = (showStudentPricing && hasStudentDiscount) || hasEventDiscount;
  const finalPrice = discountBreakdown.finalPrice;

  return (
    <Link href={`/products/${product.id}`}>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition overflow-hidden group">
        <div className="relative h-48 bg-gray-200">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
          {/* Discount Badges Overlay */}
          {hasAnyDiscount && product.stock > 0 && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {hasEventDiscount && (
                <span className="bg-green-600 text-white text-xs font-medium px-2 py-1 rounded">
                  {activeEventDiscount.name} -{formatDiscountPercentage(activeEventDiscount.percentage)}
                </span>
              )}
              {showStudentPricing && hasStudentDiscount && (
                <span className="bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded">
                  Student -{formatDiscountPercentage(Number(product.studentDiscountPercentage))}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-primary-600 uppercase">
              {product.type}
            </span>
            {product.stock > 0 && product.stock <= 5 && (
              <span className="text-xs text-blue-600">
                Only {product.stock} left
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {product.name}
          </h3>

          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              {hasAnyDiscount ? (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    ${basePrice.toFixed(2)}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${finalPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-green-600 font-medium">
                    Save ${discountBreakdown.totalDiscountAmount.toFixed(2)}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  ${basePrice.toFixed(2)}
                </span>
              )}
            </div>
            <button
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Unavailable' : 'View Details'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
