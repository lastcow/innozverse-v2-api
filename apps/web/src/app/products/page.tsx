import { Navbar } from '@/components/layout/navbar';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductFilters } from '@/components/products/product-filters';

export default function ProductsPage({
  searchParams,
}: {
  searchParams: { type?: string; search?: string; page?: string };
}) {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-2 text-gray-600">
            Browse our exclusive tech deals for students
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <ProductFilters currentType={searchParams.type} />
          </aside>

          <div className="lg:col-span-3">
            <ProductGrid
              type={searchParams.type}
              search={searchParams.search}
              page={searchParams.page ? parseInt(searchParams.page) : 1}
            />
          </div>
        </div>
      </main>
    </>
  );
}
