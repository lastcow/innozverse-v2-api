import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-8">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/products"
          className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition"
        >
          Back to Products
        </Link>
      </div>
    </div>
  );
}
