import { ProductCard } from './product-card';
import { Pagination } from './pagination';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ProductGridProps {
  type?: string;
  search?: string;
  page: number;
}

async function getProducts(type?: string, search?: string, page: number = 1) {
  const params = new URLSearchParams();
  if (type) params.set('type', type);
  if (search) params.set('search', search);
  params.set('page', page.toString());
  params.set('limit', '12');

  const response = await fetch(`${apiUrl}/api/v1/products?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

export async function ProductGrid({ type, search, page }: ProductGridProps) {
  try {
    const data = await getProducts(type, search, page);

    if (!data.products || data.products.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
          {search && (
            <p className="text-gray-400 mt-2">
              Try adjusting your search or filter criteria
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {data.pagination.totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={data.pagination.totalPages}
            type={type}
            search={search}
          />
        )}
      </div>
    );
  } catch (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 text-lg">Failed to load products</p>
        <p className="text-gray-400 mt-2">Please try again later</p>
      </div>
    );
  }
}
