'use client';

import Image from 'next/image';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/useCartStore';

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
  };
}

export function ProductDetail({ product }: ProductDetailProps) {
  const addItem = useCartStore((s) => s.addItem);

  const imageUrl = Array.isArray(product.imageUrls) && product.imageUrls.length > 0
    ? product.imageUrls[0]!
    : '/placeholder.png';

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.basePrice.toString()),
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
          <p className="text-2xl font-bold text-gray-900 mt-4">
            ${parseFloat(product.basePrice.toString()).toFixed(2)}
          </p>
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
        </div>
      </div>
    </div>
  );
}
