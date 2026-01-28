import { Navbar } from '@/components/layout/navbar';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="text-center">
          <h1 className="text-6xl font-bold mb-4">
            Welcome to Innozverse
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Exclusive tech deals for students
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/products"
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Shop Now
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
