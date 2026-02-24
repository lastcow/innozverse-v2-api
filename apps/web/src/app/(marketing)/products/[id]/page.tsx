import { ProductDetail } from '@/components/products/product-detail';
import { notFound } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getProduct(id: string) {
  const response = await fetch(`${apiUrl}/api/v1/products/${id}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getProduct(params.id);

  if (!data?.product) {
    notFound();
  }

  return (
    <>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductDetail
          product={data.product}
          activeEventDiscounts={data.activeEventDiscounts || []}
        />
      </main>
    </>
  );
}
